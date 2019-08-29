// API Support for PUT /api/product/:source:/:sid and POST /api/product/:source/:sid
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../schemas");

fluid.registerNamespace("gpii.ul.api.product.update.handler");

gpii.ul.api.product.update.handler.handleRequest = function (that) {
    var suppliedRecord = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var writeableSources = gpii.ul.api.sources.request.listWritableSources(gpii.ul.api.sources.sources, user);
    if (writeableSources.indexOf(suppliedRecord.source) !== -1) {
        // get the current record's ID
        var params = [suppliedRecord.source, suppliedRecord.sid];
        that.productReader.get({ key: JSON.stringify(params)}).then(that.processReadResponse, that.handleError);
    }
    else {
        that.options.next({ isError: true, statusCode: 401, message: that.options.messages.notAuthorized});
    }
};

gpii.ul.api.product.update.handler.processReadResponse = function (that, couchResponse) {
    var suppliedRecord = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    if (!suppliedRecord.updated) {
        suppliedRecord.updated = (new Date()).toISOString();
    };

    that.productRecord = suppliedRecord;

    if (!couchResponse) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.messages.noCouchReadResponse});
    }
    else if (couchResponse.rows.length === 0) {
        that.statusCode = 201;
        that.productPoster.set({}, suppliedRecord).then(that.processWriteResponse, that.handleError);
    }
    else if (couchResponse.rows.length === 1) {
        var couchRecord = couchResponse.rows[0].value;

        var updatedRecord = fluid.copy(suppliedRecord);
        updatedRecord._id = couchRecord._id;
        updatedRecord._rev = couchRecord._rev;

        that.productPutter.set({ id: couchRecord._id}, updatedRecord).then(that.processWriteResponse, that.handleError);
    }
    else {
        that.options.next({ isError: true, statusCode: 500, message: that.options.messages.duplicateFound});
    }

    return couchResponse;
};

gpii.ul.api.product.update.handler.processWriteResponse = function (that, couchResponse) {
    // TODO:  How can we get the status code, etc. from the couch response?  Confirm with Antranig
    if (!couchResponse) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.messages.noCouchWriteResponse});
    }
    else {
        var messageKey = that.statusCode === 200 ? "recordUpdated" : "recordCreated";
        that.sendResponse(that.statusCode, { statusCode: that.statusCode, message: that.options.messages[messageKey], product: that.productRecord });
    }

    return couchResponse;
};


fluid.defaults("gpii.ul.api.product.update.handler", {
    gradeNames: ["gpii.express.handler"],
    members: {
        statusCode: 200
    },
    messages: {
        duplicateFound:       "More than one record exists for this source and SID.  Contact an administrator for help.",
        noCouchWriteResponse: "Could not update record.  Contact an administrator for help.",
        noCouchReadResponse:  "Could not retrieve the original record from the database.  Contact an administrator for help.",
        notAuthorized:        "You are not authorized to view this record.",
        notFound:             "Could not find a record matching the specified source and id.",
        recordCreated:        "Record created.",
        recordUpdated:        "Record updated."
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
                    "key": "%key"
                }
            }
        },
        productPutter: {
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
        },
        productPoster: {
            type: "kettle.dataSource.URL",
            options: {
                gradeNames: ["kettle.dataSource.URL.writable"],
                writeMethod: "POST",
                url: "{gpii.ul.api}.options.urls.ulDb"
            }
        }
    },
    invokers: {
        processWriteResponse: {
            funcName: "gpii.ul.api.product.update.handler.processWriteResponse",
            args:     ["{that}", "{arguments}.0"] // couchResponse
        },
        handleError: {
            func: "{gpii.express.handler}.sendResponse",
            args: [ 500, { message: "{arguments}.0", url: "{that}.options.url" }] // statusCode, body
            // args: [ 500, "{arguments}.0"] // statusCode, body
            // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
        },
        handleRequest: {
            funcName: "gpii.ul.api.product.update.handler.handleRequest",
            args:     ["{that}"]
        },
        processReadResponse: {
            funcName: "gpii.ul.api.product.update.handler.processReadResponse",
            args:     ["{that}", "{arguments}.0"] // couchResponse
        }
    }
});

fluid.defaults("gpii.ul.api.product.update", {
    gradeNames:   ["gpii.ul.api.validationGatedContentAware"],
    method:       ["put", "post"],
    path:         ["/"],
    routerOptions: {
        mergeParams: true
    },
    rules: {
        requestContentToValidate: {
            "":  "body"
        }
    },
    distributeOptions: [{
        source: "{that}.options.rules.requestContentToValidate",
        target: "{that gpii.express.handler}.options.rules.requestContentToValidate"
    }],
    handlers: {
        json: {
            contentType:   "application/json",
            handlerGrades: ["gpii.ul.api.product.update.handler"]
        }
    },
    components: {
        validationMiddleware: {
            options: {
                rules: "{gpii.ul.api.product.update}.options.rules",
                inputSchema: {
                    "type": "object",

                    "properties": {
                        // Required fields
                        "source": gpii.ul.api.schemas.required.product.source,
                        "sid": gpii.ul.api.schemas.required.product.sid,
                        "name": gpii.ul.api.schemas.required.product.name,
                        "description": gpii.ul.api.schemas.required.product.description,
                        "manufacturer": gpii.ul.api.schemas.required.product.manufacturer,
                        "status": gpii.ul.api.schemas.required.product.status,
                        // Optional fields
                        "uid": gpii.ul.api.schemas.product.uid,
                        "sourceData": gpii.ul.api.schemas.product.sourceData,
                        "sourceUrl": gpii.ul.api.schemas.product.sourceUrl,
                        "language": gpii.ul.api.schemas.product.language,
                        "updated": gpii.ul.api.schemas.product.updated
                    },
                    "additionalProperties": false
                }
            }
        }
    }
});
