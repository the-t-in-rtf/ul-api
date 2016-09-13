// API Support for GET /api/products
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-sort");
require("./sources");

fluid.require("%gpii-express/src/js/lib/querystring-coding.js");

fluid.registerNamespace("gpii.ul.api.products.handler");

// Sources has definitions like key: { view: // allowed roles, edit: //allowed roles}
gpii.ul.api.products.handler.resolveSourceKeys = function (sources, username) {
    return fluid.transform(sources, function (value) {
        return value === username ? "~" : value;
    });
};

gpii.ul.api.products.handler.handleRequest = function (that) {
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    // The list of desired sources is an array of source names, i.e. ["unified", "Handicat"]
    var desiredSources = userOptions.sources ? userOptions.sources : Object.keys(gpii.ul.api.sources.sources);
    if (userOptions.unified && userOptions.sources.indexOf("unified") === -1) {
        desiredSources.push("unified");
    }

    // Resolve a datasource that matches our username to ~ for the permission check.
    var resolvedSourceKeys = user ? gpii.ul.api.products.handler.resolveSourceKeys(desiredSources, user.username) : desiredSources;
    var filteredSourceDefinitions = fluid.filterKeys(gpii.ul.api.sources.sources, resolvedSourceKeys);

    var allowedSourceKeys = gpii.ul.api.sources.request.listReadableSources(filteredSourceDefinitions, user);

    // Whatever sources the user asks to see, their "receipt" will only ever reflect the ones they have permissiont to view.
    userOptions.sources = allowedSourceKeys;

    // Save the user params for the "receipt" we will deliver later.
    that.options.request.productsParams = fluid.merge(null, that.options.defaultParams, userOptions);

    that.couchReader.get({keys: allowedSourceKeys });
};

gpii.ul.api.products.handler.processCouchResponse = function (that, couchResponse) {
    if (!couchResponse) {
        that.options.next({isError: true, params: that.options.request.productParams, statusCode: 500, message: "No response from CouchDB, can't retrieve product records."});
    }

    var products = [];

    if (that.options.request.productsParams.unified) {
        var unifiedRecordsByUid = {};
        var childrenByUid       = {};
        fluid.each(couchResponse.rows, function (row) {
            var productRecord = fluid.censorKeys(fluid.copy(row.value), that.options.couchFieldsToRemove);
            if (productRecord.source === "unified") {
                unifiedRecordsByUid[productRecord.uid] = productRecord;
            }
            else {
                if (!childrenByUid[productRecord.uid]) {
                    childrenByUid[productRecord.uid] = [];
                }
                childrenByUid[productRecord.uid].push(productRecord);
            }
        });

        fluid.each(unifiedRecordsByUid, function (unifiedRecord, uid) {
            if (childrenByUid[uid]) {
                unifiedRecord.sources = childrenByUid[uid];
            }
            products.push(unifiedRecord);
        });
    }
    else {
        fluid.each(couchResponse.rows, function (row) {
            products.push(fluid.censorKeys(fluid.copy(row.value), that.options.couchFieldsToRemove));
        });
    }

    // Sort the results.
    if (that.options.request.productsParams.sortBy) {
        gpii.sort(products, that.options.request.productsParams.sortBy);
    }

    // Page the results.
    var pagedProducts = products.slice(that.options.request.productsParams.offset, that.options.request.productsParams.offset + that.options.request.productsParams.limit);

    that.sendResponse(200, { total_rows: products.length, params: that.options.request.productsParams, products: pagedProducts, retrievedAt: (new Date()).toISOString()});
};

fluid.defaults("gpii.ul.api.products.handler", {
    gradeNames: ["gpii.express.handler"],
    couchFieldsToRemove: ["_id", "_rev"],
    rules: {
        requestContentToValidate: "{gpii.ul.api.products}.options.rules.requestContentToValidate"
    },
    timeout: 60000, // TODO:  We need to tune this in the extreme.  This is just so we can write the tests.
    fullRecordsPerRequest: 50,
    components: {
        couchReader: {
            type: "gpii.express.dataSource.urlEncodedJson",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:    ["%baseUrl%viewPath", { baseUrl: "{gpii.ul.api}.options.urls.ulDb", viewPath: "/_design/ul/_view/records_by_source"}]
                    }
                },
                termMap: {},
                listeners: {
                    "onRead.sendResponse": {
                        func: "{gpii.ul.api.products.handler}.processCouchResponse",
                        args: ["{arguments}.0"]
                    },
                    // Report back to the user on failure.
                    "onError.sendResponse": {
                        func: "{gpii.ul.api.products.handler}.handleError",
                        args: ["{arguments}.0"]
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.products.handler.handleRequest",
            args:    ["{that}"]
        },
        handleError: {
            func: "{that}.options.next",
            args: [{ isError: true, statusCode: 500, message: "{arguments}.0"}] // error
        },
        processCouchResponse: {
            funcName: "gpii.ul.api.products.handler.processCouchResponse",
            args:     ["{that}", "{arguments}.0"]
        }
    }
});

fluid.defaults("gpii.ul.api.products.middleware", {
    gradeNames: ["gpii.express.middleware.requestAware"],
    handlerGrades: ["gpii.ul.api.products.handler"]
});

fluid.defaults("gpii.ul.api.products", {
    gradeNames: ["gpii.express.router"],
    path: "/products",
    events: {
        onSchemasDereferenced: null
    },
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    },
    schemas: {
        output: "products-results.json"
    },
    defaultParams: {
        offset:  0,
        limit:   250,
        unified: true
    },
    distributeOptions: {
        source: "{that}.options.defaultParams",
        target: "{that gpii.express.handler}.options.defaultParams"
    },
    components: {
        // The JSON middleware requires valid input to access....
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                gradeNames: ["gpii.schema.validationMiddleware.handlesQueryData"],
                rules: {
                    requestContentToValidate: "{gpii.ul.api.products}.options.rules.requestContentToValidate",
                    validationErrorsToResponse: {
                        isError:    { literalValue: true },
                        statusCode: { literalValue: 400 },
                        message: {
                            literalValue: "{that}.options.messages.error"
                        },
                        fieldErrors: ""
                    }
                },
                schemaDirs: "{gpii.ul.api}.options.schemaDirs",
                schemaKey:  "products-input.json",
                messages: {
                    error: "The information you provided is incomplete or incorrect.  Please check the following:"
                },
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api.products}.events.onSchemasDereferenced.fire"
                    }
                }
            }
        },
        // Middleware to serve a JSON payload with the list of products.
        jsonMiddleware: {
            type: "gpii.ul.api.products.middleware",
            options: {
                priority: "after:validationMiddleware",
                rules: "{gpii.ul.api.products}.options.rules"
            }
        }
    }
});
