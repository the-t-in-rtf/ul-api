// Respond to requests like GET /api/product/:source:/:sid based on the requested content type.
//
// If the request content-type is "application/json", respond with the JSON source of the record.
//
// Otherwise, serve up an HTML version of the content.
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("gpii-express");
require("gpii-json-schema");

require("../lib/validationGatedContentAware");

// TODO:  Put the JSON Schema headers back in

fluid.registerNamespace("gpii.ul.api.product.get.handler");
gpii.ul.api.product.get.handler.processProductResponse = function (that, couchResponse) {
    if (!couchResponse) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.errorMessages.noCouchResponse});
        // TODO:  Discuss how to clean up this pattern
        that.events.afterResponseSent.fire(that);
    }
    else if (couchResponse.rows.length === 0) {
        that.options.next({ isError: true, statusCode: 404, message: that.options.errorMessages.notFound});
        // TODO:  Discuss how to clean up this pattern
        that.events.afterResponseSent.fire(that);
    }
    else if (couchResponse.rows.length > 1) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.errorMessages.duplicateFound});
        // TODO:  Discuss how to clean up this pattern
        that.events.afterResponseSent.fire(that);
    }
    else {
        // We transform and then filter separately so that we can include all and then filter out Couch-isms like `_id`.
        var transformedOutput = fluid.model.transformWithRules(couchResponse, that.options.rules.productCouchResponseToJson);
        that.productRecord = fluid.filterKeys(transformedOutput, that.options.couchKeysToExclude, true);

        // Only work with the same data validated by the schema validation middleware.
        var input = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

        // Look up the sources if the "sources" flag is set in {that}.request.query.
        if (input.source === "unified" && input.sources) {
            that.sourceReader.get({ uid: that.options.request.params.sid });
        }
        // No need to look up sources, just send what we have now.
        else {
            that.sendResponse(200, that.productRecord);
        }
    }
};

gpii.ul.api.product.get.handler.processSourcesResponse = function (that, couchResponse) {
    if (!couchResponse) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.errorMessages.noCouchSourceResponse});
    }
    else {
        that.productRecord.sources = [];

        // We do not use the new `transformEach` function on the list because we need to filter out keys on a
        // per-record basis.
        fluid.each(couchResponse.rows, function (couchRecord) {
            var transformedSourceRecord = fluid.model.transformWithRules(couchRecord, that.options.rules.sourceCouchResponseToJson);
            that.productRecord.sources.push(fluid.filterKeys(transformedSourceRecord, that.options.couchKeysToExclude, true));
        });

        that.sendResponse(200, that.productRecord);
    }
};

// Our main handler.  Looks up the underlying record using a kettle.dataSource and expects to call the
// underlying `gpii.express.handler` `that.sendResponse` invoker with the results.
fluid.defaults("gpii.ul.api.product.get.handler.base", {
    gradeNames: ["gpii.express.handler"],
    errorMessages: {
        noCouchResponse: "Could not retrieve the original record from the database.  Contact an administrator for help.",
        noCouchSourceResponse: "Could not retrieve the list of source records for the original record.  Contact an administrator for help.",
        notFound: "Could not find a record matching the specified source and id.",
        duplicateFound: "There was more than one record with the specified source and id.  Contact an administrator for help."
    },
    members: {
        productRecord: null
    },
    couchKeysToExclude: ["_id", "_rev"],
    rules: {
        productCouchResponseToJson: {
            "": "rows.0.value"
        },
        sourceCouchResponseToJson: {
            "": "value"
        }
    },
    components: {
        // dataSource to read main record
        productReader: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/_design/ul/_view/records?key=%key", { baseUrl: "{gpii.ul.api}.options.couch.urls.db" }]
                    }
                },
                termMap: {
                    "key":      "%key"
                },
                listeners: {
                    // Continue processing after an initial successful read.
                    "onRead.processProductResponse": {
                        func: "{gpii.ul.api.product.get.handler.base}.processProductResponse",
                        args: ["{arguments}.0"] // couchResponse
                    },
                    // Report back to the user on failure.
                    "onError.sendResponse": {
                        func: "{gpii.express.handler}.sendResponse",
                        args: [ 500, { tag: "productReader.onError", message: "{arguments}.0" }] // statusCode, body
                        // args: [ 500, "{arguments}.0"] // statusCode, body
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        },
        // dataSource for "sources" data (used with "unified" records when the `sources` query parameter is set)
        sourceReader: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/_design/ul/_view/children?key=\"%uid\"", { baseUrl: "{gpii.ul.api}.options.couch.urls.db" }]
                    }
                },
                termMap: {
                    "uid": "%uid"
                },
                listeners: {
                    // Finish processing after the "sources" are read
                    "onRead.processSourcesResponse": {
                        func: "{gpii.ul.api.product.get.handler.base}.processSourcesResponse",
                        args: ["{arguments}.0"]
                    },
                    // Report back to the user on failure.
                    "onError.sendResponse": {
                        func: "{gpii.express.handler}.sendResponse",
                        args: [ 500, { tag: "sourceReader.onError", message: "{arguments}.0" }] // statusCode, body
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        }
    },
    invokers: {
        // Start by looking up the base record
        handleRequest: {
            func: "{productReader}.get",
            args: [{
                key: {
                    expander: {
                        funcName: "JSON.stringify",
                        args: [["{gpii.express.handler}.options.request.params.source", "{gpii.express.handler}.options.request.params.sid"]] // This must be encoded as an array
                    }
                }
            }]
        },
        handleError: {
            func: "{that}.options.next",
            args: [{ isError: true, statusCode: 500, message: "{arguments}.0"}] // error
        },
        processProductResponse: {
            funcName: "gpii.ul.api.product.get.handler.processProductResponse",
            args:     ["{that}", "{arguments}.0"] // response
        },
        processSourcesResponse: {
            funcName: "gpii.ul.api.product.get.handler.processSourcesResponse",
            args:     ["{that}", "{arguments}.0"] // response
        }
    }
});

// TODO:  Create a common grade for this pattern (in handlebars)
fluid.defaults("gpii.ul.api.product.get.handler.html", {
    gradeNames: ["gpii.ul.api.product.get.handler.base", "gpii.ul.api.htmlMessageHandler"],
    templateKey: "pages/record.handlebars"
});

fluid.defaults("gpii.ul.api.product.get", {
    gradeNames:   ["gpii.ul.api.validationGatedContentAware"],
    method:       "get",
    // Support all variations, including those with missing URL params so that we can return appropriate error feedback.
    path:         ["/:source/:sid", "/:source", "/"],
    routerOptions: {
        mergeParams: true
    },
    schemaKey:    "product-get-input.json",
    handlers: {
        html: {
            contentType:   "text/html",
            handlerGrades: ["gpii.ul.api.product.get.handler.html"]
        },
        json: {
            priority:      "after:html",
            contentType:   "application/json",
            handlerGrades: ["gpii.ul.api.product.get.handler.base"]
        }
    },
    rules: {
        requestContentToValidate: {
            "sid":     "params.sid",
            "source":  "params.source",
            "sources": "query.sources"
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