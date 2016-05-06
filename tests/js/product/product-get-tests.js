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


// Wrapper to call the correct functions from the `gpii-express test helpers.
// TODO:  If this pattern comes up more often, update `gpii-express` to pass through the statusCode variable from other methods to isSaneResponse.
fluid.registerNamespace("gpii.tests.ul.api.product.get");
gpii.tests.ul.api.product.get.verifyContent = function (response, body, expected, statusCode) {
    gpii.test.express.helpers.isSaneResponse(response, body, statusCode);
    jqUnit.assertDeepEq("The message body should be as expected...", expected, body);
};

fluid.defaults("gpii.tests.ul.api.product.get", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    rawModules: [
        {
            name: "testing GET /api/product/:source/:sid",
            tests: [
                {
                    name: "Verify that an appropriate error is received when calling the interface with no parameters...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestNoParams}.send",
                            args: []
                        },
                        {
                            event:    "{requestNoParams}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // response, body, expected, statusCode
                            args:     [
                                "{requestNoParams}.nativeResponse",
                                {
                                    expander: {
                                        funcName: "JSON.parse",
                                        args: [ "{arguments}.0"]
                                    }
                                },
                                "{that}.options.expected.noParams",
                                400
                            ]
                        }
                    ]
                }
                // {
                //     name: "Verify that an appropriate error is received when calling the interface with only one parameter...",
                //     type: "test",
                //     sequence: [
                //         {
                //             func: "{requestOneParam}.send",
                //             args: []
                //         },
                //         {
                //             event:    "{requestOneParam}.events.onComplete",
                //             listener: "jqUnit.assertDeepEq",
                //             args:     [
                //                 "There should be a single validation error...",
                //                 {
                //                     expander: {
                //                         funcName: "JSON.parse",
                //                         args:     ["{arguments}.0"]
                //
                //                     }
                //                 },
                //                 "{that}.options.expected.oneParam"
                //             ]
                //         }
                //     ]
                // }

                /*
                 gpii.test.express.helpers.isSaneResponse = function (response, body, status) {
                 gpii.express.tests.helpers.verifyStringContent = function (response, body, expectedString) {
                 gpii.express.tests.helpers.verifyJSONContent = function (response, body, expected) {
                 */

                //requestSourceOnly: {

                //    jqUnit.asyncTest("Call the interface with only one parameter...", function () {
                //        request.get(getTests.getUrl + "/foo", function (error, response, body) {
                //            jqUnit.start();
                //
                //            testUtils.isSaneResponse(jqUnit, error, response, body);
                //            try{
                //                var jsonData = JSON.parse(body);
                //                jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
                //            }
                //            catch(e) {
                //                jqUnit.assertUndefined("There should be no parsing errors:\n" + body, e);
                //            }
                //        });
                //    });
                //

                //requestMissingRecord: {

                //    jqUnit.asyncTest("Looking for a record that doesn't exist...", function () {
                //        request.get(getTests.getUrl + "/foo/bar", function (error, response, body) {
                //            jqUnit.start();
                //
                //            testUtils.isSaneResponse(jqUnit, error, response, body);
                //            var jsonData = JSON.parse(body);
                //
                //            jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
                //        });
                //    });
                //

                //requestExistingRecord: {

                //    jqUnit.asyncTest("Looking for a record that exists...", function () {
                //        request.get(getTests.getUrl + "/Vlibank/B812", function (error, response, body) {
                //            jqUnit.start();
                //
                //            testUtils.isSaneResponse(jqUnit, error, response, body);
                //            var jsonData = JSON.parse(body);
                //
                //            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
                //        });
                //    });
                //

                //requestUnifiedRecord: {


                //    jqUnit.asyncTest("Looking for a unified record without sources ...", function () {
                //        request.get(getTests.getUrl + "/unified/1421059432812-144583330", function (error, response, body) {
                //            jqUnit.start();
                //
                //            testUtils.isSaneResponse(jqUnit, error, response, body);
                //            var jsonData = JSON.parse(body);
                //
                //            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
                //            if (jsonData.record) {
                //              jqUnit.assertUndefined("There should not be 'sources' data for the record...", jsonData.record.sources);
                //            }
                //        });
                //    });
                //


                //requestUnifiedRecordWithSources: {

                //    jqUnit.asyncTest("Retrieving a unified record with sources=true ...", function () {
                //        request.get(getTests.getUrl + "/unified/1421059432812-144583330?sources=true", function (error, response, body) {
                //            jqUnit.start();
                //
                //            testUtils.isSaneResponse(jqUnit, error, response, body);
                //            var jsonData = JSON.parse(body);
                //
                //            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
                //            if (jsonData.record) {
                //              jqUnit.assertNotUndefined("There should be 'sources' data for the record...", jsonData.record.sources);
                //            }
                //        });
                //    });
                //


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

                // TODO:  Request a record with an encoded slash
                // requestRecordWithSlash

                //    jqUnit.asyncTest("Retrieving a source record with a space in the source name ...", function () {
                //        request.get(getTests.getUrl + "/Dlf data/0110204", function (error, response, body) {
                //            jqUnit.start();
                //
                //            testUtils.isSaneResponse(jqUnit, error, response, body);
                //            var jsonData = JSON.parse(body);
                //
                //            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
                //        });
                //    });
                //};
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
                endpoint: "api/product/Vlibank/B812"
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
                endpoint: "product/unified/unifiedNewer?sources=true"
            }
        },
        requestSourceRecordWithSources: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "product/Vlibank/B812?sources=true"
            }
        },
        requestRecordWithSlash: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "product/slashed%2fsource/slashed%2fsid"
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
                        "missingProperty": "source"
                    },
                    "message": "The 'source' URL parameter is required."
                },
                {
                    "keyword": "required",
                    "dataPath": "",
                    "schemaPath": "#/required",
                    "params": {
                        "missingProperty": "sid"
                    },
                    "message": "The 'sid' URL parameter is required."
                }
            ]
        },
        oneParam: {
            "ok": false,
            "message": "The JSON you have provided is not valid.",
            "fieldErrors": [
                {
                    "keyword": "required",
                    "dataPath": "",
                    "schemaPath": "#/required",
                    "params": {
                        "missingProperty": "sid"
                    },
                    "message": "The 'sid' URL parameter is required."
                }
            ]
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