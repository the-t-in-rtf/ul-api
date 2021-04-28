/*

    Respond to requests like GET /api/product/:source:/:sid based on the requested content type.

    If the request content-type is "application/json", respond with the JSON source of the record.

    Otherwise, serve up an HTML version of the content.

 */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("gpii-express");
require("gpii-json-schema");

require("../lib/validationGatedContentAware");
require("../schemas");

fluid.registerNamespace("gpii.ul.api.product.get.handler");

/**
 *
 * Handle a single incoming request.  Performs an initial permission check and then requests data from CouchDB.
 *
 * @param {Object} that - The component itself.
 *
 */
gpii.ul.api.product.get.handler.handleRequest = function (that) {
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var visibleSources = gpii.ul.api.sources.request.listReadableSources(gpii.ul.api.sources.sources, user);
    if (visibleSources.indexOf(that.options.request.params.source) !== -1) {
        var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

        var params = [userOptions.source, userOptions.sid];
        that.productReader.get({ key: JSON.stringify(params)});
    }
    else {
        that.options.next({ isError: true, statusCode: 401, message: that.options.errorMessages.notAuthorized});
    }
};

/**
 *
 * Process the CouchDB response for the main record.
 *
 * @param {Object} that - The component itself.
 * @param {Object} couchResponse - The raw response from CouchDB.
 *
 */
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

        // If this unified record is a duplicate, redirect to the record this one duplicates.  Can be bypassed by setting the `noRedirect` query variable to a "truthy" value.
        if (that.productRecord.source === "unified" && that.productRecord.uid !== that.productRecord.sid && !input.noRedirect) {
            that.options.response.redirect(301, "/api/product/unified/" + that.productRecord.uid);
        }
        // Look up the sources if the "sources" flag is set in {that}.request.query.
        else if (input.source === "unified" && input.includeSources) {
            that.sourceReader.get({ uid: that.options.request.params.sid });
        }
        // No need to look up sources, just send what we have now.
        else {
            that.sendResponse(200, { product: that.productRecord });
        }
    }
};

/**
 *
 * For "unified" records, process the list of "children" returned from CouchDB.
 *
 * @param {Object} that - The component itself.
 * @param {Object} couchResponse - The raw list of "child" records for the main record's UID, as returned from CouchDB.
 *
 */
gpii.ul.api.product.get.handler.processSourcesResponse = function (that, couchResponse) {
    if (!couchResponse) {
        that.options.next({ isError: true, statusCode: 500, message: that.options.errorMessages.noCouchSourceResponse});
    }
    else {
        that.productRecord.sources = [];

        var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
        var visibleSources = gpii.ul.api.sources.request.listReadableSources(gpii.ul.api.sources.sources, user);

        // We do not use the new `transformEach` function on the list because we need to filter out keys on a
        // per-record basis.
        fluid.each(couchResponse.rows, function (couchRecord) {
            var transformedSourceRecord = fluid.model.transformWithRules(couchRecord, that.options.rules.sourceCouchResponseToJson);

            // Add non-unified records we have permission to see to "sources".
            if (transformedSourceRecord.source !== "unified" && visibleSources.indexOf(transformedSourceRecord.source) !== -1) {
                that.productRecord.sources.push(fluid.filterKeys(transformedSourceRecord, that.options.couchKeysToExclude, true));
            }
        });

        // Sort the child records by source, and sid, so that the order is consistent
        gpii.sort(that.productRecord.sources, ["source", "sid"]);

        that.sendResponse(200, { product: that.productRecord});
    }
};

gpii.ul.api.product.get.handler.sendResponse = function (that, statusCode, body) {
    gpii.express.handler.sendResponse(that, that.options.response, statusCode, body.product || body);
};

// Our main handler.  Looks up the underlying record using a kettle.dataSource and expects to call the
// underlying `gpii.express.handler` `that.sendResponse` invoker with the results.
fluid.defaults("gpii.ul.api.product.get.handler.base", {
    gradeNames: ["gpii.express.handler"],
    errorMessages: {
        noCouchResponse: "Could not retrieve the original record from the database.  Contact an administrator for help.",
        noCouchSourceResponse: "Could not retrieve the list of source products for the original record.  Contact an administrator for help.",
        notAuthorized: "You are not authorized to view this record.",
        notFound: "Could not find a record matching the specified source and id.",
        duplicateFound: "There was more than one record with the specified source and id.  Contact an administrator for help."
    },
    members: {
        productRecord: null
    },
    couchKeysToExclude: ["_id", "_rev", "_conflicts"],
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
                        args: ["%baseUrl/_design/ul/_view/products?key=%key", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
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
                        args: [ 500, { message: "{arguments}.0", url: "{that}.options.url" }] // statusCode, body
                        // args: [ 500, "{arguments}.0"] // statusCode, body
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        },
        // dataSource for "sources" data (used with "unified" products when the `sources` query parameter is set)
        sourceReader: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:     ["%baseUrl/_design/ul/_view/records_by_uid?key=\"%uid\"", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
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
                        args: [ 500, { message: "{arguments}.0" }] // statusCode, body
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.product.get.handler.handleRequest",
            args:     ["{that}"]
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
        },
        sendResponse: {
            funcName: "gpii.ul.api.product.get.handler.sendResponse",
            args: ["{that}", "{arguments}.0", "{arguments}.1"] // statusCode, body
        }
    }
});

fluid.defaults("gpii.ul.api.product.get.handler.html", {
    gradeNames: ["gpii.ul.api.product.get.handler.base", "gpii.ul.api.htmlMessageHandler"],
    templateKey: "pages/product.handlebars",
    rules: {
        bodyToExpose: {
            "layout": "layout", // This is required to support custom layouts
            "model": {
                "product":  "product"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.product.get", {
    gradeNames:   ["gpii.ul.api.validationGatedContentAware"],
    method:       "get",
    // Support all variations, including those with missing URL params so that we can return appropriate error feedback.
    path:         ["/:source/:sid", "/:source", "/"],
    routerOptions: {
        mergeParams: true
    },
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
            "sid": "params.sid",
            "source": "params.source",
            "includeSources": {
                "transform": {
                    "type": "fluid.transforms.firstValue",
                    "values": [
                        "query.includeSources",
                        {literalValue: true}
                    ]
                }
            },
            "noRedirect": "query.noRedirect"
        }
    },
    distributeOptions: [{
        source: "{that}.options.rules.requestContentToValidate",
        target: "{that gpii.express.handler}.options.rules.requestContentToValidate"
    }],
    components: {
        validationMiddleware: {
            options: {
                rules: {
                    requestContentToValidate: "{gpii.ul.api.product.get}.options.rules.requestContentToValidate"
                },
                inputSchema: {
                    "type": "object",
                    "properties": {
                        "noRedirect": {
                            "type": "boolean"
                        },
                        "includeSources": {
                            "type": "boolean"
                        },
                        "sid": gpii.ul.api.schemas.required.product.sid,
                        "source": gpii.ul.api.schemas.required.product.source
                    }
                }
            }
        }
    }
});
