/*

    A kettle dataSource that is designed to read from a CouchDB view or native endpoint and transform the results.

    To receive transformed results, your `onRead` listener should use a priority like `after: transform`.

    To examine the raw results, your `onRead` listener should use a priority like `before: transform`.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%kettle");
fluid.require("%gpii-express/src/js/lib/querystring-coding.js");

fluid.registerNamespace("gpii.ul.images.dataSources.couch");

gpii.ul.images.dataSources.couch.transformCouchResult = function (that, rawResponse) {
    // The location of individual records varies depending on whether we are dealing with a view, et cetera,
    // our first transform locates the record.
    var recordData = fluid.model.transformWithRules(rawResponse, that.options.rules.getRecords);

    // If we are dealing with multiple records, use fluid.transform to transform them all.
    if (Array.isArray(recordData)) {
        if (recordData.length === 0) {
            return [];
        }
        else {
            return fluid.transform(recordData, function (record) {
                return fluid.model.transformWithRules(record.doc || record.value, that.options.rules.transformRecord);
            });
        }
    }
    // If we are dealing with a single record, transform and return it.
    else {
        return fluid.model.transformWithRules(recordData, that.options.rules.transformRecord);
    }
};

gpii.ul.images.dataSources.couch.encodeUriComponent = function (value) {
    return encodeURIComponent(value);
};

fluid.defaults("gpii.ul.images.dataSources.couch.encodeUriComponent", {
    gradeNames: ["fluid.standardTransformFunction"]
});

/*

    For convenience, we provide reusable rules for views and individual records.

*/
gpii.ul.images.dataSources.couch.rules = {
    getRecords: {
        bulk: {
            "": "rows"
        },
        single: {
            "": ""
        }
    },
    transformRecord: {
        gallery: {
            "uid":    "uid",
            "images": "images"
        },
        metadata: {
            "uid":         "uid",
            "source":      "source",
            // We need this transform because of sources like Rehadat, which use slashes in the image_id.
            "image_id":    {
                transform: {
                    type:      "gpii.ul.images.dataSources.couch.encodeUriComponent",
                    inputPath: "image_id"
                }
            },
            "description": "description",
            "copyright":   "copyright",
            "status":      "status"
        },
        raw: {
            "": ""
        }
    }
};

fluid.defaults("gpii.ul.images.dataSources.couch", {
    gradeNames: ["gpii.express.dataSource.urlEncodedJson", "gpii.hasRequiredOptions"],
    requiredFields: {
        "baseUrl":               true,
        "rules.getRecords":      true,
        "rules.transformRecord": true,
        "endpoint":              true
    },
    rules: {
        getRecords: gpii.ul.images.dataSources.couch.rules.getRecords.bulk,
        transformRecord: gpii.ul.images.dataSources.couch.rules.transformRecord.metadata
    },
    url: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["%baseUrl%endpoint", { baseUrl: "{that}.options.baseUrl", endpoint: "{that}.options.endpoint" }]
        }
    },
    termMap: {},
    invokers: {
        "transform": {
            funcName: "gpii.ul.images.dataSources.couch.transformCouchResult",
            args:     ["{that}", "{arguments}.0"]
        }
    },
    listeners: {
        // Continue processing after an initial successful read.
        "onRead.transformResponse": {
            namespace: "transform",
            func:      "{that}.transform",
            args:      ["{arguments}.0"] // couchResponse
        }
    }
});
