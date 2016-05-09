// tests for all read methods
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../lib/fixtures");

fluid.defaults("gpii.tests.ul.api.product.get.request", {
    gradeNames: ["gpii.test.ul.api.request"],
    method:     "GET"
});

var EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 100;

// Wrapper to call the correct functions from the `gpii-express test helpers.
fluid.registerNamespace("gpii.tests.ul.api.product.get");
gpii.tests.ul.api.product.get.verifyContent = function (message, response, body, expected, statusCode) {
    gpii.test.express.helpers.isSaneResponse(response, body, statusCode);
    jqUnit.assertDeepEq(message, expected, body);
};

fluid.defaults("gpii.tests.ul.api.product.get", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    rawModules: [
        {
            name: "testing GET /api/product/:source/:sid",
            tests: [
                {
                    name: "Call /api/product with no URL parameters...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestNoParams}.send",
                            args: []
                        },
                        {
                            event:    "{requestNoParams}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "There should be multiple errors if we omit the source and sid...",
                                "{requestNoParams}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.noParams",
                                400
                            ]
                        }
                    ]
                },
                {
                    name: "Call /api/product with only one URL parameter...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestOneParam}.send",
                            args: []
                        },
                        {
                            event:    "{requestOneParam}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "There should be a single validation error if we omit the sid...",
                                "{requestNoParams}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.oneParam",
                                400
                            ]
                        }
                    ]
                },
                {
                    name: "Request a non-existant record from /api/product...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestMissingRecord}.send",
                            args: []
                        },
                        {
                            event:    "{requestMissingRecord}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should see an error that indicates that the record could not be found...",
                                "{requestMissingRecord}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.missing",
                                404
                            ]
                        }
                    ]
                },
                {
                    name: "Request an existing record from /api/product...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestExistingRecord}.send",
                            args: []
                        },
                        {
                            event:    "{requestExistingRecord}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should see the requested record...",
                                "{requestExistingRecord}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.existing",
                                200
                            ]
                        }
                    ]
                },
                {
                    name: "Request a unified record without sources from /api/product...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestUnifiedRecord}.send",
                            args: []
                        },
                        {
                            event:    "{requestUnifiedRecord}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should see the unified record...",
                                "{requestUnifiedRecord}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.unified",
                                200
                            ]
                        }
                    ]
                },
                {
                    name: "Request a unified record with sources from /api/product...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestUnifiedRecordWithSources}.send",
                            args: []
                        },
                        {
                            event:    "{requestUnifiedRecordWithSources}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should see the unified record...",
                                "{requestUnifiedRecordWithSources}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.unifiedSources",
                                200
                            ]
                        }
                    ]
                },
                {
                    name: "Request a source record with sources from /api/product...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestSourceRecordWithSources}.send",
                            args: []
                        },
                        {
                            event:    "{requestSourceRecordWithSources}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should see the source record...",
                                "{requestSourceRecordWithSources}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.source",
                                200
                            ]
                        }
                    ]
                }



                //requestSourceRecordWithSources: {

                //    jqUnit.asyncTest("Retrieving a source record with sources=true ...", function () {
                //        request.get(getTests.getUrl + "/Vlibank/B812?sources=true", function (error, response, body) {
                //            jqUnit.start();
                //
                //            testUtils.isSaneResponse(jqUnit, error, response, body);
                //            var jsonData = JSON.parse(body);
                //
                //            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
                //            if (jsonData.record) {
                //                jqUnit.assertUndefined("There should not be any 'sources' data for the record...", jsonData.record.sources);
                //            }
                //        });
                //    });
                //
            ]
        }
    ],
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        },
        requestNoParams: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product"
            }
        },
        requestOneParam: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified"
            }
        },
        requestMissingRecord: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified/notfound"
            }
        },
        requestExistingRecord: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified/unifiedNewer"
            }
        },
        requestUnifiedRecord: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified/unifiedNewer"
            }
        },
        requestUnifiedRecordWithSources: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified/unifiedNewer?sources=true"
            }
        },
        requestSourceRecordWithSources: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/admin/admin1?sources=true"
            }
        }
    },
    expected: {
        noParams: {
            "isError": true,
            "message": "The information you provided is incomplete or incorrect.  Please check the following:",
            "fieldErrors": [
                {
                    "keyword": "required",
                    "dataPath": "",
                    "schemaPath": "#/required",
                    "params": {
                        "missingProperty": "sid"
                    },
                    "message": "The 'sid' URL parameter is required."
                },
                {
                    "keyword": "required",
                    "dataPath": "",
                    "schemaPath": "#/required",
                    "params": {
                        "missingProperty": "source"
                    },
                    "message": "The 'source' URL parameter is required."
                }
            ]
        },
        oneParam: {
            "isError": true,
            "message": "The information you provided is incomplete or incorrect.  Please check the following:",
            "fieldErrors": [{
                "keyword": "required",
                "dataPath": "",
                "schemaPath": "#/required",
                "params": {
                    "missingProperty": "sid"
                },
                "message": "The 'sid' URL parameter is required."
            }]
        },
        missing: {
            isError: true,
            message: "Could not find a record matching the specified source and id."
        },
        existing: {
            "uid":          "unifiedNewer",
            "source":       "unified",
            "sid":          "unifiedNewer",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2015-01-01"
        },
        unified: {
            "uid":          "unifiedNewer",
            "source":       "unified",
            "sid":          "unifiedNewer",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2015-01-01"
        },
        unifiedSources: {
            "uid":          "unifiedNewer",
            "source":       "unified",
            "sid":          "unifiedNewer",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2015-01-01",
            "sources": [{
                "uid":          "unifiedNewer",
                "source":       "admin",
                "sid":          "admin1",
                "name":         "sample product 1",
                "description":  "sample description 1",
                "manufacturer": { "name": "sample manufacturer 1" },
                "updated":      "2014-01-01"
            }]
        },
        source:  {
            "uid":          "unifiedNewer",
            "source":       "admin",
            "sid":          "admin1",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2014-01-01"
        }
    }
});

fluid.defaults("gpii.tests.ul.api.product.get.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:   9753,
        pouch: 3579
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.product.get"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.product.get.environment");