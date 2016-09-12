// API Support for GET /api/product/:source:/:id
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-sort");
require("./sources");

fluid.require("%gpii-express/src/js/lib/querystring-coding.js");

// Marker grade to allow us to distribute options to our two pieces of middleware.
fluid.defaults("gpii.ul.api.search.middleware", {
    gradeNames: ["gpii.express.middleware"]
});

fluid.registerNamespace("gpii.ul.api.search.middleware.html");

/**
 *
 * A simple "gating" function to ensure that the form is only rendered if the client accepts the right content type.
 * This must be a separate piece of middleware and must be loaded before the schema validation because we serve the
 * initial form whether or not we have query data.
 *
 * @param that {Object} The middleware component itself.
 * @param request {Object} The Express request object.
 * @param response {Object} The Express response object.
 * @param next {Function} The next piece of middleware in the chain.
 */
gpii.ul.api.search.middleware.html.renderFormOrDefer = function (that, request, response, next) {
    if (request.accepts(that.options.contentTypes)) {
        gpii.express.singleTemplateMiddleware.renderForm(that, request, response);
    }
    else {
        next();
    }
};

// A component to serve up the search form.
fluid.defaults("gpii.ul.api.search.middleware.html", {
    gradeNames: ["gpii.ul.api.search.middleware", "gpii.express.singleTemplateMiddleware"],
    templateKey: "pages/search.handlebars",
    contentTypes: ["text/html"],
    invokers: {
        middleware: {
            funcName: "gpii.ul.api.search.middleware.html.renderFormOrDefer",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] //request, response, next
        }
    }
});

fluid.registerNamespace("gpii.ul.api.search.handler");

gpii.ul.api.search.handler.handleRequest = function (that) {
    var searchPromise = that.searchReader.get(gpii.ul.api.search.handler.requestToLucene(that));
    searchPromise.then(that.processSearchResponse);
};

/**
 *
 *  There is a hard limit of ~7,000 characters that you can use in a single query string, so we request products in
 *  smaller batches and knit them together once the entire sequence of promises has completed.
 *
 * @param that {Object} The handler component itself.
 * @param keys {Array} The full array of keys we are looking up.  We will only look up the full products based on the offset and limit.
 *
 */
gpii.ul.api.search.handler.getFullRecords = function (that, keys) {
    var promises = [];

    for (var a = 0; a < keys.length; a += that.options.fullRecordsPerRequest) {
        promises.push(that.unifiedRecordReader.get({keys: keys.slice(a, a + that.options.fullRecordsPerRequest)}));
    }
    return fluid.promise.sequence(promises);
};

gpii.ul.api.search.handler.processSearchResponse = function (that, luceneResponse) {
    // Reuse the rules we used to generate the "user parameters" that were validated by our upstream JSON Schema validation middleware.
    var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    // Merge the search defaults with the parameters the user passed in.
    // TODO:  Discuss whether we can avoid calling `fluid.merge` directly.
    that.options.request.searchParams = fluid.merge(null, that.options.searchDefaults, userOptions);

    if (!luceneResponse) {
        that.options.next({isError: true, statusCode: 500, params: that.options.request.searchParams, message: "No response from Lucene, can't prepare search results."});
    }
    if (luceneResponse.rows && luceneResponse.rows.length > 0) {
        // Hold on to the relevant search results so that we can order the final results and include sources if requested.
        //  We do it this was because a) we want distinct uids only, first occurrence first, and b) we need to preserve the order.
        var distinctKeys = {};
        var unifiedKeys  = [];
        fluid.each(luceneResponse.rows, function (record) {
            if (!distinctKeys[record.fields.uid]) {
                distinctKeys[record.fields.uid] = true;
                unifiedKeys.push(record.fields.uid);
            }
        });

        // We cannot sort or page here, because we don't yet have the full records.
        // TODO: Discuss with Antranig
        that.options.request.luceneKeys = unifiedKeys;

        gpii.ul.api.search.handler.getFullRecords(that, that.options.request.luceneKeys).then(that.processFullRecordResponse);
    }
    else {
        that.sendResponse(404, { total_rows: 0, products: [], params: that.options.request.searchParams, retrievedAt: (new Date()).toISOString() });
    }
};

/**
 *
 * A function to take one or more couch responses and knit them together into a final response for the user.
 *
 * @param that {Object} The handler component itself.
 * @param couchResponses {Array} An array of responses from CouchDB.
 *
 */
gpii.ul.api.search.handler.processFullRecordResponse = function (that, couchResponses) {
    if (!couchResponses) {
        that.options.next({isError: true, params: that.options.request.searchParams, statusCode: 500, message: "No response from CouchDB, can't prepare final search results."});
    }

    var products = [];
    var unifiedRecordsByUid = {};
    var childrenByUid       = {};
    fluid.each(couchResponses, function (couchResponse) {
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
    });

    // Filter the source records according to the source permissions
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var allowedSources = gpii.ul.api.sources.request.listAllowedSources(gpii.ul.api.sources.sources, user);

    fluid.each(unifiedRecordsByUid, function (unifiedRecord, uid) {
        if (childrenByUid[uid]) {
            unifiedRecord.sources = childrenByUid[uid].filter(function (sourceRecord) {
                return allowedSources.indexOf(sourceRecord.source) !== -1;
            });
        }
    });

    // Iterate through the raw search results from that.options.request and add them to the final results in order:
    var distinctUids = [];

    fluid.each(that.options.request.luceneKeys, function (uid) {
        if (uid && distinctUids.indexOf(uid) === -1) {
            distinctUids.push(uid);

            // Look up the full record from the upstream results.
            var unifiedRecord = unifiedRecordsByUid[uid];
            if (unifiedRecord) {
                products.push(unifiedRecord);
            }
            else {
                fluid.log("Unable to retrieve full record for uid `" + uid + "`...");
            }
        }
    });

    if (that.options.request.query.sortBy) {
        gpii.sort(products, that.options.request.query.sortBy);
    }

    var pagedProducts = products.slice(that.options.request.searchParams.offset, that.options.request.searchParams.offset + that.options.request.searchParams.limit);

    that.sendResponse(200, { total_rows: products.length, params: that.options.request.searchParams, products: pagedProducts, retrievedAt: (new Date()).toISOString()});
};

/**
 *
 * Parse the request parameters used by this endpoint and convert them for use with couchdb-lucene
 *
 * @param that {Object} The handler component itself.
 */
gpii.ul.api.search.handler.requestToLucene = function (that) {
    // Break down the raw query into raw parameters and those that need to become part of the `q` variable.
    // First the raw parameters
    var generatedDirectModel = fluid.model.transformWithRules(that.options.request, that.options.rules.requestToLucene);

    // Now the "sources" and "statuses" parameters
    if (that.options.request.query.sources && that.options.request.query.sources.length > 0) {
        generatedDirectModel.q += " AND (source:" + fluid.makeArray(that.options.request.query.sources).join(" OR source:") + ") ";
    }
    if (that.options.request.query.statuses && that.options.request.query.statuses.length > 0) {
        generatedDirectModel.q += " AND (status:" + fluid.makeArray(that.options.request.query.statuses).join(" OR status:") + ") ";
    }

    return generatedDirectModel;
};

fluid.defaults("gpii.ul.api.search.handler", {
    gradeNames: ["gpii.express.handler"],
    couchFieldsToRemove: ["_id", "_rev"],
    rules: {
        requestContentToValidate: "{gpii.ul.api.search}.options.rules.requestContentToValidate",
        requestToLucene: {
            q:      "query.q",
            limit:  { literalValue: 1000 }
        }
    },
    fullRecordsPerRequest: 50,
    components: {
        searchReader: {
            type: "gpii.express.dataSource.urlEncodedJson",
            options: {
                url: "{gpii.ul.api}.options.urls.lucene",
                avoidStringifying: true,
                termMap: {},
                listeners: {
                    // Report back to the user on failure.
                    "onError.sendResponse": {
                        func: "{gpii.ul.api.search.handler}.handleError",
                        args: ["{arguments}.0"]
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        },
        unifiedRecordReader: {
            type: "gpii.express.dataSource.urlEncodedJson",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/_design/ul/_view/records_by_uid", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {},
                listeners: {
                    "onError.sendResponse": {
                        func: "{gpii.ul.api.search.handler}.handleError",
                        args: ["{arguments}.0"]
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.search.handler.handleRequest",
            args:    ["{that}"]
        },
        handleError: {
            func: "{that}.options.next",
            args: [{ isError: true, statusCode: 500, message: "{arguments}.0"}] // error
        },
        processSearchResponse: {
            funcName: "gpii.ul.api.search.handler.processSearchResponse",
            args:     ["{that}", "{arguments}.0"]
        },
        processFullRecordResponse: {
            funcName: "gpii.ul.api.search.handler.processFullRecordResponse",
            args:     ["{that}", "{arguments}.0"]
        }
    }
});

fluid.defaults("gpii.ul.api.search.middleware.json", {
    gradeNames: ["gpii.ul.api.search.middleware", "gpii.express.middleware.requestAware"],
    handlerGrades: ["gpii.ul.api.search.handler"]
});

fluid.defaults("gpii.ul.api.search", {
    gradeNames: ["gpii.express.router"],
    path: "/search",
    searchDefaults: {
        offset:  0,
        limit:   250,
        unified: false
    },
    events: {
        onSchemasDereferenced: null
    },
    rules: {
        requestContentToValidate: {
            "includeSources": "query.includeSources",
            "limit":          "query.limit",
            "offset":         "query.offset",
            "q":              "query.q",
            "sortBy":         "query.sortBy",
            "sources":        "query.sources",
            "statuses":       "query.statuses",
            "unified":        "query.unified"
        }
    },
    distributeOptions: [{
        source: "{that}.options.searchDefaults",
        target: "{that gpii.express.handler}.options.searchDefaults"
    }],
    schemas: {
        output: "search-results.json"
    },
    components: {
        // Middleware to serve the HTML form.
        htmlForm: {
            type: "gpii.ul.api.search.middleware.html",
            options: {
                priority: "first"
            }
        },
        // The JSON middleware requires valid input to access....
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                gradeNames: ["gpii.schema.validationMiddleware.handlesQueryData"],
                priority:   "after:htmlForm",
                rules: {
                    requestContentToValidate: "{gpii.ul.api.search}.options.rules.requestContentToValidate",
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
                schemaKey:  "search-input.json",
                messages: {
                    error: "The information you provided is incomplete or incorrect.  Please check the following:"
                },
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api.search}.events.onSchemasDereferenced.fire"
                    }
                }
            }
        },
        // Middleware to serve a JSON payload.
        jsonMiddleware: {
            type: "gpii.ul.api.search.middleware.json",
            options: {
                priority: "after:validationMiddleware",
                rules: "{gpii.ul.api.search}.options.rules"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.suggest", {
    gradeNames: ["gpii.ul.api.search"],
    path: "/suggest",
    distributeOptions: {
        record: "suggest-input.json",
        target: "{that gpii.schema.validationMiddleware}.options.schemaKey"
    },
    searchDefaults: {
        offset:  0,
        limit:   5,
        unified: false
    }
});
