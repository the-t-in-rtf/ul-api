/*

    Add a "merge" API endpoint to collapse duplicate "unified" records into one "original" record with all "child"
    records and one or more duplicates of the original.

*/
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%gpii-express");
fluid.require("%gpii-express-user");

fluid.registerNamespace("gpii.ul.api.merge");

gpii.ul.api.merge.handleRequest = function (that) {
    var sourceKeys = fluid.makeArray(that.options.request.query.sources);

    // We do not allow merging a record with itself.
    if (sourceKeys.indexOf(that.options.request.query.target) !== -1) {
        that.sendResponse(400, { isError: true, message: "Cannot merge a record with itself."});
    }
    else {
        // Look up all information for the target, the duplicate records, and any child records that will be affected by the update.
        var allKeys = sourceKeys.concat(that.options.request.query.target);
        var recordReadPromise = that.recordReader.get({ keys: allKeys, include_docs: true});
        recordReadPromise.then(that.handleRecordsLookupSuccess, that.handleError);
    }
};

gpii.ul.api.merge.handleRecordsLookupSuccess = function (that, lookupResults) {
    var duplicateRecords = [];
    var childRecords = [];
    var targetRecord = false;
    var sourceMap = {};

    fluid.each(lookupResults.rows, function (row) {
        var record = row.value;
        sourceMap[record.source] = true;
        if (record.source === "unified") {
            if (record.sid === that.options.request.query.target) {
                targetRecord = record;
            }
            else {
                duplicateRecords.push(record);
            }
        }
        else {
            childRecords.push(record);
        }
    });

    var distinctSources = Object.keys(sourceMap);

    // TODO: Make sure options.sessionKey is set
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var writeableSources = gpii.ul.api.sources.request.listWritableSources(gpii.ul.api.sources.sources, user);

    var sourcesWithoutPermission = [];
    fluid.each(distinctSources, function (source) {
        if (writeableSources.indexOf(source) === -1) {
            sourcesWithoutPermission.push(source);
        }
    });

    if (sourcesWithoutPermission.length) {
        that.sendResponse(401, { isError: true, message: "You do not have permission to the following record sources:" + sourcesWithoutPermission.join(", ")});
    }
    else if (!targetRecord) {
        that.sendResponse(404, { isError: true, message: "Cannot find a valid unified record with the specified uid."});
    }
    else if (!duplicateRecords.length) {
        that.sendResponse(404, { isError: true, message: "You must specify one or more valid source records to merge with the target record."});
    }
    else if (targetRecord.sid !== targetRecord.uid) {
        that.sendResponse(400, { isError: true, message: "You cannot merge duplicates with a record that has already been merged."});
    }
    else {
        var updatePayload = fluid.transform(duplicateRecords.concat(childRecords), function (row) {
            var updatedValue = fluid.copy(row);
            updatedValue.uid = that.options.request.query.target;

            if (updatedValue.source === "unified") {
                updatedValue.status = "deleted";
            }

            return updatedValue;
        });

        // Perform the bulk update
        var updatePromise = that.updateWriter.set({}, { docs: updatePayload });
        updatePromise.then(that.handleUpdateWriteSuccess, that.handleError);
    }
};

gpii.ul.api.merge.handleUpdateWriteSuccess = function (that) {
    that.sendResponse(200, { isError: false, message: "Records updated." });
};

gpii.ul.api.merge.handleError = function (that, errorPayload) {
    that.sendResponse(500, { isError: true, message: errorPayload });
};

fluid.defaults("gpii.ul.api.merge.handler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.merge.handleRequest",
            args: ["{that}"]
        },
        handleError: {
            funcName: "gpii.ul.api.merge.handleError",
            args: ["{that}", "{arguments}.0"] // errorPayload
        },
        handleRecordsLookupSuccess: {
            funcName: "gpii.ul.api.merge.handleRecordsLookupSuccess",
            args: ["{that}", "{arguments}.0"] // lookupResults
        },
        handleUpdateWriteSuccess: {
            funcName: "gpii.ul.api.merge.handleUpdateWriteSuccess",
            args: ["{that}", "{arguments}.0"] // writeResults
        }
    },
    components: {
        recordReader: {
            type: "gpii.express.dataSource.urlEncodedJson",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:    ["%baseUrl%viewPath", { baseUrl: "{gpii.ul.api}.options.urls.ulDb", viewPath: "/_design/ul/_view/records_by_uid"}]
                    }
                },
                termMap: {}
            }
        },
        updateWriter: {
            type: "kettle.dataSource.URL",
            options: {
                writable: true,
                writeMethod: "POST",
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:    ["%baseUrl%viewPath", { baseUrl: "{gpii.ul.api}.options.urls.ulDb", viewPath: "/_bulk_docs"}]
                    }
                },
                termMap: {}
            }
        }
    }
});

fluid.defaults("gpii.ul.api.merge.middleware", {
    gradeNames: ["gpii.express.middleware.requestAware"],
    handlerGrades: ["gpii.ul.api.merge.handler"]
});

fluid.defaults("gpii.ul.api.merge", {
    gradeNames: ["gpii.ul.api.validatingEndpoint"],
    method: "post",
    path: "/merge",
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    },
    components: {
        loginRequired: {
            type: "gpii.express.user.middleware.loginRequired",
            options: {
                priority: "first",
                sessionKey: "{gpii.ul.api}.options.sessionKey"
            }
        },
        validationMiddleware: {
            options: {
                gradeNames: ["gpii.schema.validationMiddleware.handlesQueryData"],
                inputSchema: {
                    "type": "object",
                    "properties": {
                        "target": gpii.ul.api.schemas.required.product.uid,
                        "sources": {
                            "required": true,
                            "anyOf": [
                                gpii.ul.api.schemas.product.uid,
                                {
                                    "type": "array",
                                    "items": gpii.ul.api.schemas.product.uid
                                }
                            ]
                        }
                    }
                }
            }
        },
        middleware: {
            type: "gpii.ul.api.merge.middleware",
            options: {
                priority: "after:renderedValidationError"
            }
        }
    }
});
