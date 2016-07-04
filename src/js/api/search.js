// API Support for GET /api/product/:source:/:id
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-sort");

fluid.require("%gpii-express/src/js/lib/querystring-coding.js");

fluid.registerNamespace("gpii.ul.api.search");

fluid.registerNamespace("gpii.ul.api.search.handler.base");

gpii.ul.api.search.handler.base.handleRequest = function (that) {
    var searchPromise = that.searchReader.get(gpii.ul.api.search.handler.base.requestToLucene(that));
    searchPromise.then(that.processSearchResponse);
};


/**
 *
 *  There is a hard limit of ~7,000 characters that you can use in a single query string, so we request products in
 *  smaller batches and knit them together once the entire sequence of promises has completed.
 *
 * @param that {Object} The handler component itself.
 * @param keys {Array} The full array of keys we are looking up.  We will only look up the full products based on the offset and limit.
 * @param dataSource {Object} The dataSource we will use to look up the products.
 */
gpii.ul.api.search.handler.base.getFullRecords = function (that, keys, dataSource) {
    var promises = [];

    for (var a = 0; a < keys.length; a += that.options.fullRecordsPerRequest) {
        promises.push(dataSource.get({keys: keys.slice(a, a + that.options.fullRecordsPerRequest)}));
    }
    return fluid.promise.sequence(promises);
};


gpii.ul.api.search.handler.base.processSearchResponse = function (that, luceneResponse) {
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
        var promise;
        var dataSource;
        if (that.options.request.searchParams.unified) {
            dataSource = that.unifiedRecordReader;
            //  We do it this was because a) we want distinct uids only, first occurrence first, and b) we need to preserve the order.
            var distinctKeys = {};
            var unifiedKeys  = [];
            fluid.each(luceneResponse.rows, function (record) {
                if (!distinctKeys[record.fields.uid]) {
                    distinctKeys[record.fields.uid] = true;
                    unifiedKeys.push(record.fields.uid);
                }
            });

            that.options.request.luceneKeys = unifiedKeys;

        }
        else {
            dataSource = that.nonUnifiedRecordReader;

            var nonUnifiedKeys = luceneResponse.rows.map(function (record) {
                return [record.fields.source, record.fields.sid];
            });

            that.options.request.luceneKeys = nonUnifiedKeys;

            promise = gpii.ul.api.search.handler.base.getFullRecords(that, nonUnifiedKeys, that.nonUnifiedRecordReader);
        }

        // that.options.request.slicedLuceneKeys = that.options.request.luceneKeys.slice(that.options.request.searchParams.offset, that.options.request.searchParams.offset + that.options.request.searchParams.limit);

        promise = gpii.ul.api.search.handler.base.getFullRecords(that, that.options.request.luceneKeys, dataSource);
        promise.then(that.processFullRecordResponse);
    }
    else {
        that.sendResponse(404, { total_rows: 0, params: that.options.request.searchParams, message: "No search results found."});
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
gpii.ul.api.search.handler.base.processFullRecordResponse = function (that, couchResponses) {
    if (!couchResponses) {
        that.options.next({isError: true, params: that.options.request.searchParams, statusCode: 500, message: "No response from CouchDB, can't prepare final search results."});
    }

    var products = [];
    if (that.options.request.searchParams.unified) {
        var unifiedRecordsByUid = {};
        var childrenByUid       = {};
        fluid.each(couchResponses, function (couchResponse) {
            fluid.each(couchResponse.rows, function (row) {
                if (row.value.source === "unified") {
                    unifiedRecordsByUid[row.value.uid] = row.value;
                }
                else {
                    if (!childrenByUid[row.value.uid]) {
                        childrenByUid[row.value.uid] = [];
                    }
                    childrenByUid[row.value.uid].push(row.value);
                }
            });
        });

        fluid.each(unifiedRecordsByUid, function (unifiedRecord, uid) {
            if (childrenByUid[uid]) {
                unifiedRecord.sources = childrenByUid[uid];
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
    }
    else {
        var recordsBySource = {};
        fluid.each(couchResponses, function (couchResponse) {
            fluid.each(couchResponse.rows, function (row) {
                if (!recordsBySource[row.value.source]) {
                    recordsBySource[row.value.source] = {};
                }
                recordsBySource[row.value.source][row.value.sid] = row.value;
            });
        });

        fluid.each(that.options.request.luceneKeys, function (row) {
            products.push(recordsBySource[row[0]][row[1]]);
        });
    }

    if (that.options.request.query.sortBy) {
        gpii.sort(products, that.options.request.query.sortBy)
    }

    that.sendResponse(200, { total_rows: products.length, params: that.options.request.searchParams, products: products});
};

/**
 *
 * Parse the request parameters used by this endpoint and convert them for use with couchdb-lucene
 *
 * @param that {Object} The handler component itself.
 */
gpii.ul.api.search.handler.base.requestToLucene = function (that) {
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

fluid.defaults("gpii.ul.api.search.handler.base", {
    gradeNames: ["gpii.express.handler", "gpii.schema.validationMiddleware.handlesQueryData"],
    rules: {
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
                        func: "{gpii.ul.api.search.handler.base}.handleError",
                        args: ["{arguments}.0"]
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        },
        // dataSource for "sources" data (used with "unified" products when the `sources` query parameter is set)
        nonUnifiedRecordReader: {
            type: "gpii.express.dataSource.urlEncodedJson",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/_design/ul/_view/products", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {},
                listeners: {
                    "onError.sendResponse": {
                        func: "{gpii.ul.api.search.handler.base}.handleError",
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
                        args: ["%baseUrl/_design/ul/_view/byuid", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {},
                listeners: {
                    "onError.sendResponse": {
                        func: "{gpii.ul.api.search.handler.base}.handleError",
                        args: ["{arguments}.0"]
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        }
    },
    invokers: {
        // TODO:  Replace this with a handler function that calls the required dataSource get methods and chains them together as a promise.
        handleRequest: {
            funcName: "gpii.ul.api.search.handler.base.handleRequest",
            args:    ["{that}"]
        },
        handleError: {
            func: "{that}.options.next",
            args: [{ isError: true, statusCode: 500, message: "{arguments}.0"}] // error
        },
        processSearchResponse: {
            funcName: "gpii.ul.api.search.handler.base.processSearchResponse",
            args:     ["{that}", "{arguments}.0"]
        },
        processFullRecordResponse: {
            funcName: "gpii.ul.api.search.handler.base.processFullRecordResponse",
            args:     ["{that}", "{arguments}.0"]
        }
    }
});

// TODO: Check to see if we have done the renderer bit somewhere else.
fluid.defaults("gpii.ul.api.search.handlers.html", {
    gradeNames: ["gpii.ul.api.search.handler.base"],
    invokers: {
        sendResponse: {
            funcName: "",
            args:     ["{that}", "{arguments}.0"]
        }
    }
});

// TODO: add support for versions

fluid.registerNamespace("gpii.ul.api.search.middleware.formByDefault");

/**
 *
 * We want to send the search form if a) The client accepts HTML and b) there is no query data.  We need to do this
 * separately to avoid falling afoul of the JSON Schema Validation that takes place directly after this middleware.
 *
 * @param that {Object} The middleware component itself.
 * @param request {Object} The Express request object.
 * @param response {Object} The Express response object.
 * @param next {Function} The next piece of middleware in the chain.
 */
gpii.ul.api.search.middleware.formByDefault.serveInitialFormIfNeeded = function (that, request, response, next) {
    if (request.accepts(that.options.contentTypes) && !request.query.q) {
        gpii.express.singleTemplateMiddleware.renderForm(that, request, response);
    }
    else {
        next();
    }
};

// A component to serve up the search form.
fluid.defaults("gpii.ul.api.search.middleware.formByDefault", {
    gradeNames: ["gpii.express.singleTemplateMiddleware"],
    templateKey: "pages/search.handlebars",
    contentTypes: ["text/html"],
    invokers: {
        middleware: {
            funcName: "gpii.ul.api.search.middleware.formByDefault.serveInitialFormIfNeeded",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] //request, response, next
        }
    }
});

fluid.defaults("gpii.ul.api.search", {
    gradeNames: ["gpii.ul.api.validationGatedContentAware"],
    path: "/search",
    searchDefaults: {
        offset:  0,
        limit:   250,
        unified: false
    },
    distributeOptions: {
        source: "{that}.options.searchDefaults",
        target: "{that gpii.ul.api.search.handler.base}.options.searchDefaults"
    },
    schemas: {
        input:  "search-input.json",
        output: "search-results.json"
    },
    handlers: {
        json: {
            contentType:   ["application/json"],
            handlerGrades: ["gpii.ul.api.search.handler.base"]
        }
    },
    components: {
        // Middleware to serve the HTML form if we have no query data
        serveInitialForm: {
            type: "gpii.ul.api.search.middleware.formByDefault",
            options: {
                priority: "before:validationMiddleware"
            }
        },
        validationMiddleware: {
            options: {
                gradeNames: ["gpii.schema.validationMiddleware.handlesQueryData"]
            }
        }
    }
});

fluid.defaults("gpii.ul.api.suggest", {
    gradeNames: ["gpii.ul.api.search"],
    path: "/suggest",
    schemas: {
        input: "suggest-input.json"
    },
    searchDefaults: {
        offset:  0,
        limit:   5,
        unified: false
    }
});
