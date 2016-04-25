// tests for all read methods
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../lib/fixtures");

fluid.defaults("gpii.ul.api.tests.product.get.request", {
    gradeNames: ["gpii.ul.api.tests.request.json"],
    method:     "GET"
});


// Wrapper to call the correct functions from the `gpii-express test helpers.
// TODO:  If this pattern comes up more often, updated `gpii-express` to pass through the statusCode variable
//        from other methods to isSaneResponse.
fluid.registerNamespace("gpii.ul.api.tests.product.get");
gpii.ul.api.tests.product.get.verifyContent = function (response, body, expected, statusCode) {
    gpii.express.tests.helpers.isSaneResponse(response, body, statusCode);
    jqUnit.assertDeepEq("The message body should be as expected...", expected, body);
};


fluid.defaults("gpii.ul.api.tests.product.get", {
    gradeNames: ["gpii.ul.api.tests.testCaseHolder"],
    rawModules: [
        {
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
                            listener: "gpii.ul.api.tests.product.get.verifyContent",
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
                 gpii.express.tests.helpers.isSaneResponse = function (response, body, status) {
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
        requestNoParams: {
            type: "gpii.ul.api.tests.product.get.request",
            options: {
                endpoint: "product"
            }
        },
        requestOneParam: {
            type: "gpii.ul.api.tests.product.get.request",
            options: {
                endpoint: "product/unified"
            }
        },
        requestMissingRecord: {
            type: "gpii.ul.api.tests.product.get.request",
            options: {
                endpoint: "product/unified/notfound"
            }
        },
        requestExistingRecord: {
            type: "gpii.ul.api.tests.product.get.request",
            options: {
                endpoint: "product/Vlibank/B812"
            }
        },
        requestUnifiedRecord: {
            type: "gpii.ul.api.tests.product.get.request",
            options: {
                endpoint: "unified/unifiedNewer"
            }
        },
        requestUnifiedRecordWithSources: {
            type: "gpii.ul.api.tests.product.get.request",
            options: {
                endpoint: "product/unified/unifiedNewer?sources=true"
            }
        },
        requestSourceRecordWithSources: {
            type: "gpii.ul.api.tests.product.get.request",
            options: {
                endpoint: "product/Vlibank/B812?sources=true"
            }
        },
        requestRecordWithSlash: {
            type: "gpii.ul.api.tests.product.get.request",
            options: {
                endpoint: "product/slashed%2fsource/slashed%2fsid"
            }
        }
    },
    expected: {
        noParams: {
            "ok": false,
            "message": "The JSON you have provided is not valid.",
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


gpii.ul.api.tests.testEnvironment({
    ports: {
        api:   9753,
        pouch: 3579
    },
    components: {
        testCaseHolder: {
            type: "gpii.ul.api.tests.product.get"
        }
    }
});
