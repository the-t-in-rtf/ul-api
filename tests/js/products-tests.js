/* eslint-env node */
// Tests for GET /api/product
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../");
gpii.ul.api.loadTestingSupport();

// jqUnit.asyncTest("Look for products updated after a very old date...", function () {
//     var options = {
//         "url": productsTests.config.express.baseUrl + "products",
//         "qs": { updated: "1970-01-01T16:54:12.023Z" }
//     };
//     request.get(options, function (error, response, body) {
//         jqUnit.start();
//
//         testUtils.isSaneResponse(jqUnit, error, response, body);
//         var jsonData = JSON.parse(body);
//
//         jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//         if (jsonData.records) {
//             jqUnit.assertTrue("The list should not be empty...", jsonData.records.length > 0);
//         }
//     });
// });
//
// jqUnit.asyncTest("Look for products updated after a distant future date...", function () {
//     var options = {
//         "url": productsTests.config.express.baseUrl + "products",
//         "qs": { updated: "3000-01-01T16:54:12.023Z" }
//     };
//     request.get(options, function (error, response, body) {
//         jqUnit.start();
//
//         testUtils.isSaneResponse(jqUnit, error, response, body);
//         var jsonData = JSON.parse(body);
//
//         jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//         if (jsonData.records) {
//             jqUnit.assertEquals("The list should be empty...", 0, jsonData.records.length);
//         }
//     });
// });
//
// jqUnit.asyncTest("Look for products, limiting by source...", function () {
//     var options = {
//         "url": productsTests.config.express.baseUrl + "products",
//         "qs": { source: "unified" }
//     };
//     request.get(options, function (error, response, body) {
//         jqUnit.start();
//
//         testUtils.isSaneResponse(jqUnit, error, response, body);
//         var jsonData = JSON.parse(body);
//
//         jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//         if (jsonData.records) {
//             var unifiedRecordCount = jsonData.records.length;
//             jqUnit.assertTrue("The list of unified products should not be empty...", unifiedRecordCount > 0);
//
//             jqUnit.stop();
//             var options = {
//                 "url": productsTests.config.express.baseUrl + "products",
//                 "qs": { source: ["unified", "Vlibank"] }
//             };
//             request.get(options, function (error, response, body) {
//                 jqUnit.start();
//
//                 testUtils.isSaneResponse(jqUnit, error, response, body);
//                 var jsonData = JSON.parse(body);
//
//                 jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//                 if (jsonData.records) {
//                     var combinedRecordCount = jsonData.records.length;
//                     jqUnit.assertTrue("The list of combined products should not be empty...", combinedRecordCount > 0);
//                     jqUnit.assertTrue("There should be more combined products than unified products...", combinedRecordCount > unifiedRecordCount);
//                 }
//             });
//
//
//         }
//     });
// });
//
// jqUnit.asyncTest("Look for products, limiting by status...", function () {
//     var options = {
//         "url": productsTests.config.express.baseUrl + "products"
//     };
//     request.get(options, function (error, response, body) {
//         jqUnit.start();
//
//         testUtils.isSaneResponse(jqUnit, error, response, body);
//         var jsonData = JSON.parse(body);
//
//         jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//         if (jsonData.records) {
//             var unlimitedRecordCount = jsonData.records.length;
//             jqUnit.assertTrue("The list of products should not be empty...", unlimitedRecordCount > 0);
//
//             jqUnit.stop();
//             var options = {
//                 "url": productsTests.config.express.baseUrl + "products",
//                 "qs": { status: ["deleted"] }
//             };
//             request.get(options, function (error, response, body) {
//                 jqUnit.start();
//
//                 testUtils.isSaneResponse(jqUnit, error, response, body);
//                 var jsonData = JSON.parse(body);
//
//                 jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//                 if (jsonData.records) {
//                     var deletedRecordCount = jsonData.records.length;
//                     jqUnit.assertTrue("There should be less 'deleted' products than total products...", deletedRecordCount < unlimitedRecordCount);
//                 }
//             });
//         }
//     });
// });
//
// jqUnit.asyncTest("Look for products, limiting by multiple statuses...", function () {
//     var options = {
//         "url": productsTests.config.express.baseUrl + "products",
//         "qs": { status: ["deleted"] }
//     };
//     request.get(options, function (error, response, body) {
//         jqUnit.start();
//
//         testUtils.isSaneResponse(jqUnit, error, response, body);
//         var jsonData = JSON.parse(body);
//
//         jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//         if (jsonData.records) {
//             var deletedRecordCount = jsonData.records.length;
//
//             jqUnit.stop();
//             var options = {
//                 "url": productsTests.config.express.baseUrl + "products",
//                 "qs": { status: ["deleted", "new", "active"] }
//             };
//             request.get(options, function (error, response, body) {
//                 jqUnit.start();
//
//                 testUtils.isSaneResponse(jqUnit, error, response, body);
//                 var jsonData = JSON.parse(body);
//
//                 jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//                 if (jsonData.records) {
//                     var combinedRecordCount = jsonData.records.length;
//                     jqUnit.assertTrue("There should be more products from multiple statuses than from just one...", deletedRecordCount < combinedRecordCount);
//                 }
//             });
//         }
//     });
// });
//
//
// jqUnit.asyncTest("Present unified products limited by source...", function () {
//     var options = {
//         "url": productsTests.config.express.baseUrl + "products",
//         "qs": { sources: true }
//     };
//     request.get(options, function (error, response, body) {
//         jqUnit.start();
//
//         testUtils.isSaneResponse(jqUnit, error, response, body);
//         var jsonData = JSON.parse(body);
//
//         jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//         if (jsonData.records) {
//             var unlimitedRecordCount = jsonData.records.length;
//             jqUnit.assertTrue("The list of products should not be empty...", unlimitedRecordCount > 0);
//
//             jqUnit.stop();
//
//             var limitedOptions = {
//                 "url": productsTests.config.express.baseUrl + "products",
//                 "qs": { sources: true, source: "Vlibank" }
//             };
//             request.get(limitedOptions, function (error, response, body) {
//                 jqUnit.start();
//                 testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                 var jsonData = JSON.parse(body);
//
//                 jqUnit.assertNotUndefined("A list of products should have been returned...", jsonData.records);
//                 var limitedRecordCount = jsonData.records.length;
//                 jqUnit.assertTrue("There should be fewer products return when we limit the results by source...", limitedRecordCount < unlimitedRecordCount);
//             });
//         }
//     });
// });

// TODO: Test filtering by a single status
// TODO: Test filtering using multiple statuses fields
// TODO: Filter using an array of statuses.

// TODO: Confirm that we can filter by other sources once we're logged in

// TODO: Confirm that both array and multiple parameter sources=foo&sources=bar notation are supported.

// TODO: Confirm that we can get just the data for "our" source by setting unified to false.// TODO: Test sorting

// TODO: Port "updated" tests from jqUnit code.

// TODO: Test JSON  Schema validation by requesting a non-existant status

fluid.registerNamespace("gpii.ul.api.tests.products");

gpii.ul.api.tests.products.checkResults = function (message, expected, actual, minRecords) {
    jqUnit.assertLeftHand(message, expected, actual);
    gpii.ul.api.tests.products.hasMinRecords(message, actual, minRecords);
};

gpii.ul.api.tests.products.hasMinRecords = function (message, actual, minRecords) {
    if (minRecords) {
        jqUnit.assertTrue(message + "(record count)", actual.products.length >= minRecords);
    }
};

gpii.ul.api.tests.products.checkFirstPage = function (firstBody, firstRequest) {
    firstRequest.body = firstBody; // hold onto the body for the second comparison
    gpii.ul.api.tests.products.hasMinRecords("The first page should have results...", firstBody, 1);
};

gpii.ul.api.tests.products.checkSecondPage = function (secondBody, firstRequest) {
    gpii.ul.api.tests.products.hasMinRecords("The second page should have results...", secondBody, 1);

    var lastFirstPageRecord   = firstRequest.body.products.slice(-1)[0];
    var firstSecondPageRecord = secondBody.products[0];
    jqUnit.assertDeepEq("The last record from the first page should equal the first record from the second page...", lastFirstPageRecord, firstSecondPageRecord);
};

// Each test has a request instance of `kettle.test.request.http` or `gpii.test.ul.api.request`, and a test module that wires the request to the listener that handles its results.
fluid.defaults("gpii.ul.api.tests.products.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    expected: {
        defaults: {
            "params": {
                "sources": ["unified"],
                "unified": true,
                "offset": 0,
                "limit": 250
            }
        },
        loggedIn: {
            "sources": [
                "unified",
                "existing"
            ]
        }
    },
    rawModules: [
        {
            name: "Tests for GET /api/products...",
            tests: [
                {
                    name: "Testing the endpoint defaults...",
                    type: "test",
                    sequence: [
                        {
                            func: "{defaultRequest}.send"
                        },
                        {
                            event:     "{defaultRequest}.events.onComplete",
                            listener:  "gpii.ul.api.tests.products.checkResults",
                            args:      ["The defaults should return the expected results...", "{that}.options.expected.defaults", "@expand:JSON.parse({arguments}.0)", 1] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{defaultRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Testing paging...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstPageRequest}.send"
                        },
                        {
                            event:     "{firstPageRequest}.events.onComplete",
                            listener:  "gpii.ul.api.tests.products.checkFirstPage",
                            args:      ["@expand:JSON.parse({arguments}.0)", "{firstPageRequest}"] // firstBody, firstRequest
                        },
                        {
                            func: "{secondPageRequest}.send"
                        },
                        {
                            event:     "{secondPageRequest}.events.onComplete",
                            listener:  "gpii.ul.api.tests.products.checkSecondPage",
                            args:      ["@expand:JSON.parse({arguments}.0)", "{firstPageRequest}"] // secondBody, firstRequest
                        }
                    ]
                }
            ]
        }
    ],
    // Our request components
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        },
        defaultRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products"
            }
        },
        firstPageRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?limit=10"
            }
        },
        secondPageRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?offset=9&limit=1"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.tests.products.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:    9806,
        couch:  6809
    },
    components: {
        testCaseHolder: {
            type: "gpii.ul.api.tests.products.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.ul.api.tests.products.environment");
