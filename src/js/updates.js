// API support for "update" detection, where one or more sources are compared to the "unified" record.  Used to prepare
// a report of updates so that vendors can see new content from other sources.
//
// By default, returns the list of unified products that are newer than the source.  If the `sourceNewer` param is set to
// `true`, returns the list of unified products that are older than the source.
//
// Both sets can be optionally filtered to only return changes after a set point by adding the `updated` parameter,
// which should be a date in ISO 9660 format.
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./lib/initialHtmlForm");

fluid.require("%gpii-json-schema");
fluid.require("%gpii-sort");

fluid.registerNamespace("gpii.ul.api.updates.handler.json");

gpii.ul.api.updates.handler.json.handleRequest = function (that) {
    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    // The list of desired sources is an array of source names, i.e. ["unified", "Handicat"]
    var desiredSources = userOptions.sources ? fluid.makeArray(userOptions.sources) : Object.keys(gpii.ul.api.sources.sources);
    if (desiredSources.indexOf("unified") === -1) {
        desiredSources.push("unified");
    }

    // Resolve a datasource that matches our username to ~ for the permission check.
    var resolvedSourceKeys = user ? gpii.ul.api.products.handler.resolveSourceKeys(desiredSources, user.username) : desiredSources;
    var filteredSourceDefinitions = fluid.filterKeys(gpii.ul.api.sources.sources, resolvedSourceKeys);

    var allowedSourceKeys = gpii.ul.api.sources.request.listReadableSources(filteredSourceDefinitions, user);

    if (allowedSourceKeys.length < desiredSources.length) {
        that.options.next({isError: true, params: that.options.request.productParams, statusCode: 401, message: that.options.messages.noPermission});
    }
    else {
        that.productReader.get({keys: JSON.stringify(allowedSourceKeys)});
    }
};

gpii.ul.api.updates.handler.json.maxDate = function (dates) {
    return new Date(Math.max.apply(null, fluid.transform(dates, gpii.ul.api.updates.handler.json.stringToDate)));
};

gpii.ul.api.updates.handler.json.stringToDate = function (dateAsString) {
    return new Date(dateAsString);
};

gpii.ul.api.updates.handler.json.processCouchResponse = function (that, couchResponse) {
    if (!couchResponse) {
        that.options.next(that.options.messages.couchError);
    }
    else {
        var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

        // Sort into unified and source records
        var unifiedRecords = [];
        var sourceRecords = {};
        fluid.each(couchResponse.rows, function (row) {
            var productRecord = fluid.censorKeys(fluid.copy(row.value), that.options.couchKeysToExclude);
            if (productRecord.source === "unified") {
                unifiedRecords.push(productRecord);
            }
            // Filter by source
            else {
                if (sourceRecords[productRecord.uid] === undefined) {
                    sourceRecords[productRecord.uid] = [];
                }
                sourceRecords[productRecord.uid].push(productRecord);
            }
        });

        // Group into a set of unfiltered clusters by UID.
        fluid.each(unifiedRecords, function (unifiedRecord) {
            if (sourceRecords[unifiedRecord.uid]) {
                gpii.sort(sourceRecords[unifiedRecord.uid], ["source", "sid"]);
                unifiedRecord.sources = sourceRecords[unifiedRecord.uid];
            }
        });

        // Evaluate each cluster to confirm if there are relevant differences, filtering by date, status, etc.
        var matchingClusters = [];

        fluid.each(unifiedRecords, function (cluster) {
            var includeCluster = false;

            fluid.each(cluster.sources, function (sourceRecord) {
                // Filter out cases in which neither record in the comparison is new enough.
                if (userOptions.updatedSince) {
                    var mostRecentlyUpdated = gpii.ul.api.updates.handler.json.maxDate([sourceRecord.updated, cluster.updated]);
                    if (mostRecentlyUpdated < new Date(userOptions.updatedSince)) {
                        return;
                    }
                }

                var sourceIsNewer = sourceRecord.updated > cluster.updated;
                if ((!sourceIsNewer && !userOptions.sourceNewer) || (sourceIsNewer && userOptions.sourceNewer)) {
                    includeCluster = true;
                }
            });

            if (includeCluster) {
                matchingClusters.push(cluster);
            }
        });

        gpii.sort(matchingClusters, ["name"]);
        that.sendResponse(200, { params: userOptions, total_rows: matchingClusters.length, products: matchingClusters });
    }

    return couchResponse;
};

fluid.defaults("gpii.ul.api.updates.handler.json", {
    gradeNames: ["gpii.express.handler"],
    couchKeysToExclude: ["_id", "_rev", "_conflicts"],
    messages: {
        couchError:   "No response from CouchDB, can't retrieve product records.",
        noPermission: "You do not have permission to view one or more of the sources you requested."
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.updates.handler.json.handleRequest",
            args:     ["{that}"]
        },
        processCouchResponse: {
            funcName:  "gpii.ul.api.updates.handler.json.processCouchResponse",
            args:     ["{that}", "{arguments}.0"]
        }
    },
    components: {
        productReader: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    //  args:     ["http://localhost:%port/%dbName/_design/ul/_view/records_by_source?keys=%keys", "{that}.options.couch"]

                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:     ["%baseUrl/_design/ul/_view/records_by_source?keys=%keys", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {
                    "keys": "%keys"
                },
                listeners: {
                    // Finish processing after the "sources" are read
                    "onRead.processCouchResponse": {
                        func: "{gpii.ul.api.updates.handler.json}.processCouchResponse",
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
    }
});

fluid.defaults("gpii.ul.api.updates.handler.html", {
    gradeNames: ["gpii.ul.api.htmlMessageHandler"],
    templateKey: "pages/updates.handlebars",
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            // We don't actually pass any data, we just render the form and let it do its work.
            args: [200, {}] // statusCode, body
        }
    }
});

fluid.defaults("gpii.ul.api.updates", {
    gradeNames: ["gpii.express.router"],
    path:       "/updates",
    components: {
        htmlForm: {
            type: "gpii.ul.api.middleware.initialHtmlForm",
            options: {
                priority: "first",
                templateKey: "pages/updates.handlebars"
            }
        },
        // The JSON middleware requires valid input to access....
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                priority:   "after:htmlForm",
                rules: {
                    requestContentToValidate: "{gpii.ul.api.search}.options.rules.requestContentToValidate"
                }
            }
        },
        // Middleware to serve a JSON payload.
        jsonMiddleware: {
            type: "gpii.express.middleware.requestAware",
            options: {
                priority: "after:validationMiddleware",
                handlerGrades: ["gpii.ul.api.updates.handler.json"],
                rules: "{gpii.ul.api.search}.options.rules"
            }
        }
    },
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    },
    distributeOptions: [
        {
            source: "{that}.options.rules.requestContentToValidate",
            target: "{that gpii.express.handler}.options.rules.requestContentToValidate"
        }
    ]
});
