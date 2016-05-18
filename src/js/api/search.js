// API Support for GET /api/product/:source:/:id
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-couch-cushion");

fluid.registerNamespace("gpii.ul.api.search");

fluid.registerNamespace("gpii.ul.api.search.handler.base");

gpii.ul.api.search.handler.base.processSearchResponse = function (that, luceneResponse) {

    // Reuse the rules we used to generate the "user parameters" that were validated by our upstream JSON Schema validation middleware.
    var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    // Merge the search defaults with the parameters the user passed in.
    // TODO:  Discuss whether we can avoid calling `fluid.merge` directly.
    // TODO:  Discuss how to handle "falsy" values passed in as strings.
    // TODO:  Discuss how to handle number values passed in as strings.
    that.options.request.searchParams = fluid.merge(null, that.options.searchDefaults, userOptions);

    if (!luceneResponse) {
        that.options.next({isError: true, statusCode: 500, params: that.options.request.searchParams, message: "No response from Lucene, can't prepare search results."});
    }
    if (luceneResponse.rows && luceneResponse.rows.length > 0) {
        // Hold on to the original search results so that we can order the final results and to include sources if requested.
        that.options.request.luceneResponse = luceneResponse;

        if (that.options.request.searchParams.unified) {
            var unifiedKeys = luceneResponse.rows.map(function (record) {
                return record.fields.uid;
            });


            // TODO:  Add safety check for cases when `keys` is too large, for example, chaining multiple requests for pieces of the action, or disallowing more than X results.

            // We have to stringify the array to avoid having Qs mangle it into multiple values, i.e. `keys=foo&keys=bar` instead of `keys=['foo','bar']`.
            that.unifiedRecordReader.get({keys: JSON.stringify(unifiedKeys)});
        }
        else {
            var nonUnifiedKeys = luceneResponse.rows.map(function (record) {
                return [record.fields.source, record.fields.sid];
            });


            // TODO:  Add safety check for cases when `keys` is too large, for example, chaining multiple requests for pieces of the action, or disallowing more than X results.

            // We have to stringify the array to avoid having Qs mangle it into multiple values, i.e. `keys=foo&keys=bar` instead of `keys=['foo','bar']`.
            that.nonUnifiedRecordReader.get({keys: JSON.stringify(nonUnifiedKeys)});
        }
    }
    else {
        that.sendResponse(404, { total_rows: 0, params: that.options.request.searchParams, message: "No search results found."});
    }

    // Return the upstream response in case anyone else wants to do something with it.
    return luceneResponse;
};

gpii.ul.api.search.handler.base.processFullRecordResponse = function (that, couchResponse) {
    if (!couchResponse) {
        that.options.next({isError: true, params: that.options.request.searchParams, statusCode: 500, message: "No response from CouchDB, can't prepare final search results."});
    }

    // offset,limit

    var products = [];
    if (that.options.request.searchParams.unified) {
        var unifiedRecordsByUid = {};
        var childrenByUid       = {};
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

        fluid.each(unifiedRecordsByUid, function (unifiedRecord, uid) {
            if (childrenByUid[uid]) {
                unifiedRecord.sources = childrenByUid[uid];
            }
        });

        // Iterate through the raw search results from that.options.request and add them to the final results in order:
        var distinctUids = [];

        fluid.each(that.options.request.luceneResponse.rows, function (row) {
            var record = row.fields;
            if (record.uid && distinctUids.indexOf(record.uid) === -1) {
                distinctUids.push(record.uid);

                // Look up the full record from the upstream results.
                var unifiedRecord = unifiedRecordsByUid[record.uid];
                if (unifiedRecord) {
                    products.push(unifiedRecord);
                }
                else {
                    fluid.log("Unable to retrieve full record for uid `" + record.uid + "`...");
                }
            }
        });
    }
    else {
        fluid.each(that.options.request.luceneResponse.rows, function (row) {
            products.push(row.fields);
        });
    }

    var intOffset  = parseInt(that.options.request.searchParams.offset, 10);
    var intLimit   = parseInt(that.options.request.searchParams.limit, 10);
    var recordPage = products.slice(intOffset, intOffset + intLimit);

    that.sendResponse(200, { total_rows: products.length, params: that.options.request.searchParams, products: recordPage});

    // Return the upstream response in case anyone else wants to do something with it.
    return couchResponse;
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
    if (that.options.request.query.sources) {
        generatedDirectModel.q += " AND (source:" + fluid.makeArray(that.options.request.query.sources).join(" OR source:") + ") ";
    }
    if (that.options.request.query.statuses) {
        generatedDirectModel.q += " AND (status:" + fluid.makeArray(that.options.request.query.statuses).join(" OR status:") + ") ";
    }
    
    return generatedDirectModel;
};

fluid.defaults("gpii.ul.api.search.handler.base", {
    gradeNames: ["gpii.express.handler", "gpii.schema.validationMiddleware.handlesQueryData"],
    rules: {
        requestToLucene: {
            q:      "query.q",
            sort:   "query.sortBy",
            limit:  { literalValue: 1000 }
        }
    },
    components: {
        searchReader: {
            type: "gpii.couchdb.cushion.dataSource.urlEncodedJsonReader",
            options: {
                url: "{gpii.ul.api}.options.urls.lucene",
                termMap: {},
                listeners: {
                    // Continue processing after an initial successful read.
                    "onRead.processSearchResponse": {
                        funcName: "{gpii.ul.api.search.handler.base}.processSearchResponse",
                        args:     ["{arguments}.0"] // couchResponse
                    },
                    // Report back to the user on failure.
                    "onError.sendResponse": {
                        func: "{gpii.ul.api.search.handler.base}.handleError",
                        args: ["{arguments}.0"]
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        },
        // dataSource for "sources" data (used with "unified" records when the `sources` query parameter is set)
        nonUnifiedRecordReader: {
            type: "gpii.couchdb.cushion.dataSource.urlEncodedJsonReader",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/_design/ul/_view/records", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {},
                listeners: {
                    "onRead.processFullRecordResponse": {
                        funcName: "{gpii.ul.api.search.handler.base}.processFullRecordResponse",
                        args:     ["{arguments}.0"]
                    },
                    "onError.sendResponse": {
                        func: "{gpii.ul.api.search.handler.base}.handleError",
                        args: ["{arguments}.0"]
                        // TODO:  Discuss with Antranig how to retrieve HTTP status codes from kettle.datasource.URL
                    }
                }
            }
        },
        unifiedRecordReader: {
            type: "gpii.couchdb.cushion.dataSource.urlEncodedJsonReader",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/_design/ul/_view/byuid", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {},
                listeners: {
                    "onRead.processFullRecordResponse": {
                        funcName: "{gpii.ul.api.search.handler.base}.processFullRecordResponse",
                        args:     ["{arguments}.0"]
                    },
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
        handleRequest: {
            func: "{searchReader}.get",
            args: ["@expand:gpii.ul.api.search.handler.base.requestToLucene({gpii.ul.api.search.handler.base})"] // directModel, userOptions
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