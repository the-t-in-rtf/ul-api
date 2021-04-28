// API Support for GET /api/products
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-sort");
require("./sources");
require("./lib/htmlMessageHandler");

fluid.require("%gpii-express/src/js/lib/querystring-coding.js");

fluid.registerNamespace("gpii.ul.api.products.handler");

/**
 *
 * Resolve user-specific keys like ~username to ~ so that we can can correctly check the permissions.
 *
 * @param {Array} sources - An array of source names.
 * @param {Object} username - The user object stored in our request session.
 * @return {Array} The list of "resolved" source keys.
 *
 */
gpii.ul.api.products.handler.resolveSourceKeys = function (sources, username) {
    return fluid.transform(sources, function (value) {
        return value === "~" + username ? "~" : value;
    });
};

/**
 *
 * Handle a single incoming request.  Performs a few initial checks and then requests data from CouchDB.
 *
 * Fulfills the contract outlined in `gpii.express.handler`:
 * https://github.com/GPII/gpii-express/blob/master/docs/handler.md
 *
 * @param {Object} that - The component itself
 *
 */
gpii.ul.api.products.handler.handleRequest = function (that) {
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);
    that.options.request.productsParams = fluid.merge(null, that.options.defaultParams, userOptions);

    // The list of desired sources is an array of source names, i.e. ["unified", "Handicat"]
    var desiredSources = that.options.request.productsParams.sources ? fluid.makeArray(that.options.request.productsParams.sources) : gpii.ul.api.sources.request.listReadableSources(gpii.ul.api.sources.sources, user);
    if (that.options.request.productsParams.unified && desiredSources.indexOf("unified") === -1) {
        desiredSources.push("unified");
    }

    that.options.request.productsParams.sources = desiredSources;

    // Resolve a datasource that matches our username to ~ for the permission check.
    var resolvedSourceKeys = user ? gpii.ul.api.products.handler.resolveSourceKeys(desiredSources, user.username) : desiredSources;
    var filteredSourceDefinitions = fluid.filterKeys(gpii.ul.api.sources.sources, resolvedSourceKeys);

    var allowedSourceKeys = gpii.ul.api.sources.request.listReadableSources(filteredSourceDefinitions, user);

    // Throw a 401 error if any of the requested sources are not visible.  This check is only relevant if the user
    // specified a source variable, as the default is to filter "all sources" down to "all visible sources for this user".
    // This error is also reported for non-existent sources, but we should not clarify this, as it would allow people
    // to trawl through and determine valid usernames by requesting ~{username} until they got a 401 instead of a 404.
    if (allowedSourceKeys.length < desiredSources.length) {
        that.options.next({isError: true, params: that.options.request.productParams, statusCode: 401, message: that.options.messages.noPermission});
    }
    else {
        that.couchReader.get({keys: desiredSources });
    }
};

/**
 *
 * Confirm that an individual record matches the filters (source, "last updated" date) specified in the query parameters.
 *
 * @param {Object} that - The component itself.
 * @param {Object} record - The record that is being evaluated.
 * @return {Boolean} `true` if the record matches all filters, `false` if it does not.
 *
 */
gpii.ul.api.products.handler.matchesFilters = function (that, record) {
    // Filter by status
    if (that.options.request.productsParams.status && fluid.makeArray(that.options.request.productsParams.status).indexOf(record.status) === -1) {
        return false;
    }

    // Filter by last updated
    if (that.options.request.productsParams.updatedSince) {
        var recordUpdated = new Date(record.updated);
        var includeAfter = new Date(that.options.request.productsParams.updatedSince);

        if (recordUpdated < includeAfter) {
            return false;
        }
    }

    return true;
};

/**
 *
 * Process the raw response from CouchDB and produce results that match the API documentation.
 *
 * @param {Object} that - The component itself.
 * @param {Object} couchResponse - The raw response from CouchDB.
 *
 */
gpii.ul.api.products.handler.processCouchResponse = function (that, couchResponse) {
    if (!couchResponse) {
        that.options.next({isError: true, params: that.options.request.productParams, statusCode: 500, message: that.options.messages.couchError});
    }

    var products = [];

    if (that.options.request.productsParams.unified) {
        var unifiedRecordsByUid = {};
        var childrenByUid       = {};
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

        fluid.each(unifiedRecordsByUid, function (unifiedRecord, uid) {
            if (gpii.ul.api.products.handler.matchesFilters(that, unifiedRecord)) {
                if (childrenByUid[uid]) {
                    unifiedRecord.sources = childrenByUid[uid];
                }
                products.push(unifiedRecord);
            }
        });
    }
    else {
        fluid.each(couchResponse.rows, function (row) {
            if (gpii.ul.api.products.handler.matchesFilters(that, row.value)) {
                products.push(fluid.censorKeys(fluid.copy(row.value), that.options.couchFieldsToRemove));
            }
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
    couchFieldsToRemove: ["_id", "_rev", "_conflicts"],
    rules: {
        requestContentToValidate: "{gpii.ul.api.products}.options.rules.requestContentToValidate"
    },
    timeout: 60000, // TODO:  We need to tune this in the extreme.  This is just so we can write the tests.
    fullRecordsPerRequest: 50,
    messages: {
        couchError: "No response from CouchDB, can't retrieve product records.",
        noPermission: "You do not have permission to view one or more of the sources you requested."
    },
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

fluid.defaults("gpii.ul.api.products.handler.html", {
    gradeNames: ["gpii.ul.api.products.handler", "gpii.ul.api.htmlMessageHandler"],
    templateKey: "pages/products.handlebars",
    rules: {
        bodyToExpose: {
            "": "notfound",
            model: {
                "products": "products"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.products", {
    gradeNames:   ["gpii.ul.api.validationGatedContentAware"],
    timeout: 60000,
    path: "/products",
    defaultParams: {
        offset:  0,
        limit:   250,
        unified: true,
        sortBy:  "/name"
    },
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    },
    distributeOptions: [
        {
            source: "{that}.options.defaultParams",
            target: "{that gpii.express.handler}.options.defaultParams"
        },
        {
            source: "{that}.options.rules.requestContentToValidate",
            target: "{that gpii.express.handler}.options.rules.requestContentToValidate"
        }
    ],
    handlers: {
        // If we have no "accepts" headers or accept text/html, send HTML.
        html: {
            contentType:   "text/html",
            handlerGrades: ["gpii.ul.api.products.handler.html"]
        },
        // If we accept json, send that.
        json: {
            priority:      "after:html",
            contentType:   "application/json",
            handlerGrades: ["gpii.ul.api.products.handler"]
        },
        // Otherwise, send HTML.
        default: {
            priority:      "after:json",
            contentType:   "*/*",
            handlerGrades: ["gpii.ul.api.products.handler.html"]
        }
    },
    components: {
        validationMiddleware: {
            options: {
                rules: "{gpii.ul.api.products}.options.rules",
                inputSchema: {
                    "type": "object",
                    "properties": {
                        "unified": gpii.ul.api.schemas.output.unified,
                        "limit": gpii.ul.api.schemas.paging.limit,
                        "offset": gpii.ul.api.schemas.paging.offset,
                        "sources": gpii.ul.api.schemas.filters.sources,
                        "sortBy": gpii.ul.api.schemas.sortBy,
                        "status": gpii.ul.api.schemas.filters.status,
                        "updatedSince": gpii.ul.api.schemas.filters.updatedSince
                    }
                }
            }
        }
    }
});
