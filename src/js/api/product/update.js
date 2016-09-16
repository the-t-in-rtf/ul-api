// API Support for PUT /api/product/:source:/:sid and POST /api/product/:source/:sid
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.api.product.update.handler");

gpii.ul.api.product.update.handler.handleRequest = function (that) {
    var suppliedRecord = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var writeableSources = gpii.ul.api.sources.request.listWritableSources(gpii.ul.api.sources.sources, user);
    if (writeableSources.indexOf(suppliedRecord.source) !== -1) {
        // get the current record's ID
        var params = [suppliedRecord.source, suppliedRecord.sid];
        that.productReader.get({ key: JSON.stringify(params)});
    }
    else {
        that.options.next({ isError: true, statusCode: 401, message: that.options.messages.notAuthorized});
    }
};

gpii.ul.api.product.update.handler.processReadResponse = function (that, couchResponse) {
    var suppliedRecord = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    if (!couchResponse) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.messages.noCouchReadResponse});
    }
    else if (couchResponse.rows.length === 0) {
        that.productPoster.set({}, suppliedRecord);
    }
    else if (couchResponse.rows.length === 1) {
        var couchRecord = couchResponse.rows[0].value;

        var updatedRecord = fluid.copy(suppliedRecord);
        updatedRecord._id = couchRecord._id;
        updatedRecord._rev = couchRecord._rev;
        that.productPutter.set({ id: couchRecord._id}, updatedRecord);
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
        that.sendResponse(200, { statusCode: 200, message: that.options.messages.recordUpdated});
    }

    return couchResponse;
};


fluid.defaults("gpii.ul.api.product.update.handler", {
    gradeNames: ["gpii.express.handler"],
    messages: {
        duplicateFound:       "More than one record exists for this source and SID.  Contact an administrator for help.",
        noCouchWriteResponse: "Could not update record.  Contact an administrator for help.",
        noCouchReadResponse:  "Could not retrieve the original record from the database.  Contact an administrator for help.",
        notAuthorized:        "You are not authorized to view this record.",
        notFound:             "Could not find a record matching the specified source and id.",
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
                },
                listeners: {
                    "onRead.processReadResponse": {
                        func: "{gpii.express.handler}.processReadResponse",
                        args:  ["{arguments}.0"] // couchResponse
                    },
                    "onError.sendResponse": {
                        func: "{gpii.express.handler}.sendResponse",
                        args: [ 500, { message: "{arguments}.0", url: "{that}.options.url" }] // statusCode, body
                        // args: [ 500, "{arguments}.0"] // statusCode, body
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
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
                },
                listeners: {
                    "onWrite.processWriteResponse": {
                        func: "{gpii.express.handler}.processWriteResponse",
                        args:  ["{arguments}.0"] // couchResponse
                    },
                    "onError.sendResponse": {
                        func: "{gpii.express.handler}.sendResponse",
                        args: [ 500, { message: "{arguments}.0", url: "{that}.options.url" }] // statusCode, body
                        // args: [ 500, "{arguments}.0"] // statusCode, body
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        },
        productPoster: {
            type: "kettle.dataSource.URL",
            options: {
                gradeNames: ["kettle.dataSource.URL.writable"],
                writeMethod: "POST",
                url: "{gpii.ul.api}.options.urls.ulDb",
                listeners: {
                    "onWrite.processWriteResponse": {
                        func: "{gpii.express.handler}.processWriteResponse",
                        args:  ["{arguments}.0"] // couchResponse
                    },
                    "onError.sendResponse": {
                        func: "{gpii.express.handler}.sendResponse",
                        args: [ 500, { message: "{arguments}.0", url: "{that}.options.url" }] // statusCode, body
                        // args: [ 500, "{arguments}.0"] // statusCode, body
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        }
    },
    invokers: {
        processWriteResponse: {
            funcName: "gpii.ul.api.product.update.handler.processWriteResponse",
            args:     ["{that}", "{arguments}.0"] // couchResponse
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
    // Support all variations, including those with missing URL params so that we can return appropriate error feedback.
    path:         ["/"],
    routerOptions: {
        mergeParams: true
    },
    schemas: {
        input: "product-update-input.json"
    },
    handlers: {
        json: {
            contentType:   "application/json",
            handlerGrades: ["gpii.ul.api.product.update.handler"]
        }
    },
    rules: {
        requestContentToValidate: {
            "":  "body"
        }
    },
    distributeOptions: [
        {
            source: "{that}.options.rules.requestContentToValidate",
            target: "{that gpii.express.handler}.options.rules.requestContentToValidate"
        },
        {
            source: "{that}.options.rules.requestContentToValidate",
            target: "{that gpii.schema.validationMiddleware}.options.rules.requestContentToValidate"
        }
    ]
});
