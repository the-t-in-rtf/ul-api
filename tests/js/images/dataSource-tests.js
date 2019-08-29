// Tests for the dataSource used within the API.
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");
fluid.loadTestingSupport();

var jqUnit = require("node-jqunit");

fluid.require("%ul-api/src/js/server/view-read-dataSource");

require("../lib/test-harness");

fluid.defaults("gpii.tests.ul.api.images.dataSource.dataSource", {
    gradeNames: ["gpii.ul.images.dataSources.couch"],
    baseUrl:    "{harness}.options.urls.imageDb",
    events: {
        onFinalResult: null
    },
    listeners: {
        "onRead.deliverFinalResult": {
            func:     "{that}.events.onFinalResult.fire",
            args:     ["{arguments}.0"],
            priority: "after:transform"
        }
    }
});

fluid.registerNamespace("gpii.test.ul.api.images.dataSource.caseHolder");

gpii.test.ul.api.images.dataSource.caseHolder.checkBulkRecords = function (message, records) {
    jqUnit.assertTrue(message + " (there should be records)", records && records.length > 0);
    var couchisms = 0;
    fluid.each(records, function (record) {
        fluid.each(["_id", "_rev", "type"], function (field) {
            if (Object.keys(record).indexOf(field) !== -1) {
                couchisms++;
            }
        });
    });
    jqUnit.assertEquals(message + " (there should be no couchisms)", 0, couchisms);
};

//gpii.test.ul.api.images.dataSource.caseHolder.checkFourOhFour = function (response) {
//    fluid.fail("write something here");
//};

fluid.defaults("gpii.test.ul.api.images.dataSource.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [{
        name: "Testing our dataSource...",
        tests: [
            {
                name: "Test retrieving and processing a single record...",
                sequence: [
                    {
                        func: "{singleRecordSource}.get",
                        args: []
                    },
                    {
                        event:    "{singleRecordSource}.events.onFinalResult",
                        listener: "jqUnit.assertDeepEq",
                        args:     ["We should receive a single record with no couch-isms...", "{that}.options.expected.singleRecordSource", "{arguments}.0"]
                    },
                    {
                        func: "{gpii.tests.ul.api.images.harness}.events.stopFixtures.fire"
                    },
                    {
                        event:    "{testEnvironment}.events.onFixturesStopped",
                        listener: "fluid.identity"
                    }
                ]
            },
            {
                name: "Test using a complex key structure with a view...",
                sequence: [
                    {
                        func: "{viewSource}.get",
                        args: [{ startKey: ["1421059432806-826608318"] }]
                    },
                    {
                        event:    "{viewSource}.events.onFinalResult",
                        listener: "gpii.test.ul.api.images.dataSource.caseHolder.checkBulkRecords",
                        args:     ["We should receive multiple records with no couch-isms...", "{arguments}.0"] // message, records
                    },
                    {
                        func: "{gpii.tests.ul.api.images.harness}.events.stopFixtures.fire"
                    },
                    {
                        event:    "{testEnvironment}.events.onFixturesStopped",
                        listener: "fluid.identity"
                    }
                ]
            },
            {
                name: "Test handling of 404 responses...",
                sequence: [
                    {
                        func: "{fourOhFourSource}.get",
                        args: []
                    },
                    {
                        event:    "{fourOhFourSource}.events.onError",
                        listener: "gpii.test.ul.api.images.dataSource.caseHolder.checkFourOhFour",
                        args:     ["{arguments}.0", "{fourOhFourSource}"] // response, dataSource
                    },
                    {
                        func: "{gpii.tests.ul.api.images.harness}.events.stopFixtures.fire"
                    },
                    {
                        event:    "{testEnvironment}.events.onFixturesStopped",
                        listener: "fluid.identity"
                    }
                ]
            }
        ]
    }],
    expected: {
        singleRecordSource: {
            "uid":         "1421059432806-826608318",
            "source":      "~contributor",
            "image_id":    "c.png",
            "description": "An image of the letter C.",
            "copyright":   "Copyright 2016 Raising the Floor International. Licensed under the Creative Commons Attribution 4.0 International License, see https://creativecommons.org/licenses/by/4.0/",
            "status":      "approved"
        },
        rawRecordSource: {
            "_id":         "known-id",
            "uid":         "1421059432806-826608318",
            "type":        "metadata",
            "source":      "~contributor",
            "image_id":    "c.png",
            "description": "An image of the letter C.",
            "copyright":   "Copyright 2016 Raising the Floor International. Licensed under the Creative Commons Attribution 4.0 International License, see https://creativecommons.org/licenses/by/4.0/",
            "status":      "approved"
        }
    },
    components: {
        singleRecordSource: {
            type: "gpii.tests.ul.api.images.dataSource.dataSource",
            options: {
                endpoint: "/known-id",
                rules: {
                    getRecords: gpii.ul.images.dataSources.couch.rules.getRecords.single,
                    transformRecord: gpii.ul.images.dataSources.couch.rules.transformRecord.metadata
                }
            }
        },
        viewSource: {
            type: "gpii.tests.ul.api.images.dataSource.dataSource",
            options: {
                endpoint: "/_design/metadata/_view/combined",
                rules: {
                    getRecords: gpii.ul.images.dataSources.couch.rules.getRecords.bulk,
                    transformRecord: gpii.ul.images.dataSources.couch.rules.transformRecord.metadata
                }
            }
        },
        // This is not really testing anything new, only providing an example of how to get the status code from a kettle.datasource.URL
        fourOhFourSource: {
            type: "gpii.tests.ul.api.images.dataSource.dataSource",
            options: {
                endpoint: "/four/oh/four",
                rules: {
                    getRecords: gpii.ul.images.dataSources.couch.rules.getRecords.single,
                    transformRecord: gpii.ul.images.dataSources.couch.rules.transformRecord.metadata
                }
            }
        }
    }
});

fluid.defaults("gpii.test.ul.api.images.dataSource.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment", "gpii.tests.ul.api.images.harness"],
    components: {
        caseHolder: {
            type: "gpii.test.ul.api.images.dataSource.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.test.ul.api.images.dataSource.testEnvironment");
