"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var request = require("request");

fluid.defaults("gpii.ul.api.views.sync", {
    gradeNames: ["fluid.component"],
    inputFile: "%ul-api/tests/data/views.json",
    couchDbUrl: "http://admin:admin@localhost:5984/ul",
    events: {
        onSync: null
    },
    listeners: {
        "onCreate.startSync": {
            funcName: "fluid.promise.fireTransformEvent",
            args: ["{that}.events.onSync"]
        },
        "onSync.logStart": {
            priority: "first",
            funcName: "fluid.log",
            args: ["Starting view sync."]
        },
        "onSync.loadViews": {
            priority: "after:logStart",
            funcName: "gpii.ul.api.views.sync.loadViews",
            args: ["{that}"]
        },
        "onSync.syncViews": {
            priority: "after:loadViews",
            funcName: "gpii.ul.api.views.sync.syncViews",
            args: ["{that}", "{arguments}.0"] // viewData
        },
        "onSync.report": {
            priority: "after:syncViews",
            funcName: "gpii.ul.api.views.sync.report",
            args: ["{arguments}.0"]
        }
    }
});

gpii.ul.api.views.sync.loadViews = function (that) {
    var resolvedInputPath = fluid.module.resolvePath(that.options.inputFile);
    var views = require(resolvedInputPath);
    fluid.log(fluid.logLevel.IMPORTANT, "Loaded " + views.docs.length + " views.");
    return views.docs;
};

gpii.ul.api.views.sync.syncViews = function (that, viewData) {
    var syncPromises = [];
    fluid.each(viewData, function (singleView) {
        syncPromises.push(gpii.ul.api.views.sync.syncSingleView(that, singleView));
    });
    var sequence = fluid.promise.sequence(syncPromises);
    // promise-chaining events lack reject handling, so we do it here.
    sequence.then(fluid.identity, fluid.fail);
    return sequence;
};

gpii.ul.api.views.sync.syncSingleView = function (that, singleView) {
    fluid.log(fluid.logLevel.IMPORTANT, "Syncing view " + singleView._id);
    var syncPromise = fluid.promise();
    if (singleView._id) {
        var viewUrl = that.options.couchDbUrl + "/" + singleView._id;
        var getOptions = {
            url: viewUrl,
            json: true
        };
        request.get(getOptions, function (error, response, body) {
            if (error) {
                syncPromise.reject(error.message || error);
            }
            else if ([200, 404].indexOf(response.statusCode) === -1) {
                syncPromise.reject("GET request for view " + singleView._id + " returned status code " + response.statusCode + ".");
            }
            else {
                var payloadWithRev = fluid.copy(singleView);
                payloadWithRev._rev = body._rev;
                var putOptions = {
                    url:  viewUrl,
                    json: true,
                    body: payloadWithRev
                };
                request.put(putOptions, function (error, response, body) {
                    if (error) {
                        syncPromise.reject(error.message || error);
                    }
                    else if (response.statusCode !== 201) {
                        syncPromise.reject("PUT request for view " + singleView._id + " returned status code " + response.statusCode + ".");
                    }
                    else {
                        syncPromise.resolve(body);
                    }
                });
            }
        });
    }
    else {
        syncPromise.reject("A view must have an _id field to be used with this script.");
    }
    return syncPromise;
};

gpii.ul.api.views.sync.report = function (results) {
    fluid.log(fluid.logLevel.IMPORTANT, "Synced " + results.length + " views.");
    return results;
};

gpii.ul.api.views.sync();
