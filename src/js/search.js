// API Support for GET /api/product/:source:/:id
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-sort");
require("./sources");
require("./lib/initialHtmlForm");

fluid.require("%gpii-json-schema");

fluid.require("%gpii-express/src/js/lib/querystring-coding.js");

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
 * @param {Object} that - The handler component itself.
 * @param {Array} keys - The full array of keys we are looking up.  We will only look up the full products based on the offset and limit.
 * @return {Promise} A promise that will be resolved with the requested records or rejected if there is an error.
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
    that.options.request.searchParams = fluid.extend({}, that.options.searchDefaults, userOptions);

    if (!luceneResponse) {
        that.options.next({isError: true, statusCode: 500, params: that.options.request.searchParams, message: "No response from Lucene, can't prepare search results."});
    }
    if (luceneResponse.rows && luceneResponse.rows.length > 0) {
        // Hold on to the relevant search results so that we can order the final results and include sources if requested.
        //  We do it this was because a) we want distinct uids only, first occurrence first, and b) we need to preserve the order.
        var distinctKeys = {};
        var unifiedKeys  = [];
        fluid.each(luceneResponse.rows, function (record) {
            var uid = record.fields.source === "unified" ? record.fields.sid : record.fields.uid;
            if (!distinctKeys[uid]) {
                distinctKeys[uid] = true;
                unifiedKeys.push(uid);
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
 * @param {Object} that - The handler component itself.
 * @param {Array} couchResponses - An array of responses from CouchDB.
 *
 */
gpii.ul.api.search.handler.processFullRecordResponse = function (that, couchResponses) {
    if (!couchResponses) {
        that.options.next({isError: true, params: that.options.request.searchParams, statusCode: 500, message: that.options.messages.couchError});
    }

    var products = [];
    var unifiedRecordsByUid = {};
    var childrenByUid       = {};
    fluid.each(couchResponses, function (couchResponse) {
        fluid.each(couchResponse.rows, function (row) {
            var productRecord = fluid.censorKeys(fluid.copy(row.value), that.options.couchFieldsToRemove);
            if (productRecord.source === "unified") {
                unifiedRecordsByUid[productRecord.sid] = productRecord;
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
    var visibleSources = gpii.ul.api.sources.request.listReadableSources(gpii.ul.api.sources.sources, user);

    fluid.each(unifiedRecordsByUid, function (unifiedRecord, uid) {
        if (childrenByUid[uid]) {
            unifiedRecord.sources = childrenByUid[uid].filter(function (sourceRecord) {
                return visibleSources.indexOf(sourceRecord.source) !== -1;
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
            // If we are limiting by statuses for a "unified" view, the status of the unified record trumps.
            var acceptableStatuses = fluid.makeArray(that.options.request.query.statuses);
            if (unifiedRecord) {
                var matchesParams = true;

                if (acceptableStatuses.length && acceptableStatuses.indexOf(unifiedRecord.status) === -1) {
                    matchesParams = false;
                }

                if (that.options.request.searchParams.updatedSince) {
                    var recordUpdated = new Date(unifiedRecord.updated);
                    var startDate = new Date(that.options.request.searchParams.updatedSince);
                    if (recordUpdated < startDate) {
                        matchesParams = false;
                    }
                }

                if (matchesParams) {
                    products.push(unifiedRecord);
                }
            }
            else {
                fluid.log("Unable to retrieve full record for uid `" + uid + "`...");
            }
        }
    });

    if (that.options.request.searchParams.sortBy) {
        gpii.sort(products, that.options.request.searchParams.sortBy);
    }

    var pagedProducts = products.slice(that.options.request.searchParams.offset, that.options.request.searchParams.offset + that.options.request.searchParams.limit);

    that.sendResponse(200, { total_rows: products.length, params: that.options.request.searchParams, products: pagedProducts, retrievedAt: (new Date()).toISOString()});
};

/**
 *
 * Parse the request parameters used by this endpoint and convert them for use with couchdb-lucene
 *
 * @param {Object} that - The handler component itself.
 * @return {Object} The transformed query payload to be sent to couchdb-lucene.
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
    timeout: 60000,
    couchFieldsToRemove: ["_id", "_rev", "_conflicts"],
    rules: {
        requestContentToValidate: "{gpii.ul.api.search}.options.rules.requestContentToValidate",
        requestToLucene: {
            q:      "query.q",
            limit:  { literalValue: 1000 }
        }
    },
    messages: {
        couchError: "No response from CouchDB, can't prepare final search results."
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

fluid.defaults("gpii.ul.api.search", {
    gradeNames: ["gpii.express.router"],
    path: "/search",
    searchDefaults: {
        offset:  0,
        limit:   250
    },
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    },
    distributeOptions: [
        {
            source: "{that}.options.searchDefaults",
            target: "{that gpii.express.handler}.options.searchDefaults"
        },
        {
            source: "{that}.options.rules.requestContentToValidate",
            target: "{that gpii.express.handler}.options.rules.requestContentToValidate"
        }
    ],
    components: {
        htmlForm: {
            type: "gpii.ul.api.middleware.initialHtmlForm",
            options: {
                priority: "first",
                templateKey: "pages/search.handlebars"
            }
        },
        // The JSON middleware requires valid input to access....
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                priority:   "after:htmlForm",
                rules: {
                    requestContentToValidate: "{gpii.ul.api.search}.options.rules.requestContentToValidate"
                },
                inputSchema: {
                    "type": "object",
                    "properties": {
                        "limit": gpii.ul.api.schemas.paging.limit,
                        "offset": gpii.ul.api.schemas.paging.offset,
                        "q": {
                            "required": true,
                            "type": "string"
                        },
                        "sortBy": gpii.ul.api.schemas.sortBy,
                        "status": gpii.ul.api.schemas.filters.status,
                        "updatedSince": gpii.ul.api.schemas.filters.updatedSince
                    }
                }
            }
        },
        // Middleware to serve a JSON payload.
        jsonMiddleware: {
            type: "gpii.express.middleware.requestAware",
            options: {
                priority: "after:validationMiddleware",
                handlerGrades: ["gpii.ul.api.search.handler"],
                rules: "{gpii.ul.api.search}.options.rules"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.suggest", {
    gradeNames: ["gpii.ul.api.search"],
    path: "/suggest",
    searchDefaults: {
        offset:  0,
        limit:   5
    }
});
