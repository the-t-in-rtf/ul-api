// API Support for DELETE /api/product/:source:/:sid
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../schemas");

fluid.registerNamespace("gpii.ul.api.product.delete.handler");

gpii.ul.api.product["delete"].handler.handleRequest = function (that) {
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var writeableSources = gpii.ul.api.sources.request.listWritableSources(gpii.ul.api.sources.sources, user);
    if (writeableSources.indexOf(that.options.request.params.source) !== -1) {
        var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);
        // get the current record
        var params = [userOptions.source, userOptions.sid];
        that.productReader.get({ key: JSON.stringify(params)});
    }
    else {
        that.options.next({ isError: true, statusCode: 401, message: that.options.messages.notAuthorized});
    }
};

/**
 *
 * Examine the results of reading the existing data from CouchDB and continue processing.
 *
 * @param {Object} that - The handler component.
 * @param {Object} couchResponse - The raw response from CouchDB.
 * @return {Object} - The raw response from CouchDB so that further onRead listeners have access to it.
 *
 */
gpii.ul.api.product["delete"].handler.processReadResponse = function (that, couchResponse) {
    if (!couchResponse) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.messages.noCouchReadResponse});
    }
    else if (couchResponse.rows.length === 0) {
        that.options.next({ isError: true, statusCode: 404, message: that.options.messages.notFound});
    }
    else if (couchResponse.rows.length === 1) {
        var record = couchResponse.rows[0].value;
        var updatedRecord = fluid.copy(record);
        updatedRecord.status = "deleted";
        var promise = that.productWriter.set({ id: record._id}, updatedRecord);
        promise.then(that.handleSuccess, that.handleError);
    }
    else {
        that.options.next({ isError: true, statusCode: 500, message: that.options.messages.duplicateFound});
    }

    return couchResponse;
};

gpii.ul.api.product["delete"].handler.processWriteResponse = function (that, couchResponse) {
    // TODO:  How can we get the status code, etc. from the couch response?  Confirm with Antranig
    if (!couchResponse) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.messages.noCouchDeleteResponse});
    }
    else {
        that.sendResponse(200, { statusCode: 200, message: that.options.messages.recordDeleted});
    }

    return couchResponse;
};


fluid.defaults("gpii.ul.api.product.delete.handler", {
    gradeNames: ["gpii.express.handler"],
    messages: {
        duplicateFound:        "More than one record exists for this source and SID.  Contact an administrator for help.",
        noCouchDeleteResponse: "Could not delete record.  Contact an administrator for help.",
        noCouchReadResponse:   "Could not retrieve the original record from the database.  Contact an administrator for help.",
        notAuthorized:         "You are not authorized to view this record.",
        notFound:              "Could not find a record matching the specified source and id.",
        recordDeleted:         "Record deleted."
    },
    components: {
        // dataSource to read main record
        productReader: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/_design/ul/_view/products?key=%key", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {
                    "key":      "%key"
                },
                listeners: {
                    // Continue processing after an initial successful read.
                    "onRead.processReadResponse": {
                        funcName: "gpii.ul.api.product.delete.handler.processReadResponse",
                        args: ["{gpii.express.handler}", "{arguments}.0"] // couchResponse
                    },
                    // Report back to the user on failure.
                    "onError.sendResponse": {
                        func: "{gpii.express.handler}.sendResponse",
                        args: [ 500, { message: "{arguments}.0", url: "{that}.options.url" }] // statusCode, body
                        // args: [ 500, "{arguments}.0"] // statusCode, body
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        },
        productWriter: {
            type: "kettle.dataSource.URL",
            options: {
                gradeNames: ["kettle.dataSource.URL.writable"],
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/%id", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {
                    "id": "%id"
                }
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.product.delete.handler.handleRequest",
            args:     ["{that}"]
        },
        handleSuccess: {
            funcName: "gpii.ul.api.product.delete.handler.processWriteResponse",
            args:     ["{that}", "{arguments}.0"] // couchResponse
        },
        handleError: {
            func: "{that}.sendResponse",
            args: [ 500, { message: "{arguments}.0", url: "{that}.options.url" }] // statusCode, body
        }
    }
});

fluid.defaults("gpii.ul.api.product.delete", {
    gradeNames:   ["gpii.ul.api.validationGatedContentAware"],
    method:       "delete",
    // Support all variations, including those with missing URL params so that we can return appropriate error feedback.
    path:         ["/:source/:sid", "/:source", "/"],
    routerOptions: {
        mergeParams: true
    },
    rules: {
        requestContentToValidate: {
            "sid":     "params.sid",
            "source":  "params.source"
        }
    },
    distributeOptions: [{
        source: "{that}.options.rules.requestContentToValidate",
        target: "{that gpii.express.handler}.options.rules.requestContentToValidate"
    }],
    handlers: {
        json: {
            contentType:   "application/json",
            handlerGrades: ["gpii.ul.api.product.delete.handler"]
        }
    },
    components: {
        validationMiddleware: {
            options: {
                rules: "{gpii.ul.api.product.delete}.options.rules",
                inputSchema: {
                    "type": "object",
                    "properties": {
                        "sid": gpii.ul.api.schemas.required.product.sid,
                        "source": gpii.ul.api.schemas.required.product.source
                    }
                }
            }
        }
    }
});
