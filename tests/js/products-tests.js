/* eslint-env node */
// Tests for GET /api/product
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../");
gpii.ul.api.loadTestingSupport();

fluid.registerNamespace("gpii.tests.ul.api.products");

gpii.tests.ul.api.products.checkFirstPage = function (firstBody, firstRequest) {
    firstRequest.body = firstBody; // hold onto the body for the second comparison
    gpii.tests.ul.api.hasMinRecords("The first page should have results...", firstBody, 1);
};

gpii.tests.ul.api.products.checkSecondPage = function (secondBody, firstRequest) {
    gpii.tests.ul.api.hasMinRecords("The second page should have results...", secondBody, 1);

    var lastFirstPageRecord   = firstRequest.body.products.slice(-1)[0];
    var firstSecondPageRecord = secondBody.products[0];
    jqUnit.assertDeepEq("The last record from the first page should equal the first record from the second page...", lastFirstPageRecord, firstSecondPageRecord);
};

gpii.tests.ul.api.checkResultsByStatus = function (message, expected, actual, minRecords, statuses) {
    gpii.tests.ul.api.checkResults(message, expected, actual, minRecords);

    var recordsWithWrongStatus = 0;
    fluid.each(actual.products, function (record) {
        recordsWithWrongStatus += statuses.indexOf(record.status) !== -1 ? 0 : 1;
    });

    jqUnit.assertEquals(message + " (no records with the wrong status)", 0, recordsWithWrongStatus);
};

fluid.defaults("gpii.tests.ul.api.products.caseHolder", {
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
        },
        singleStatus: {
            "params": {
                "sources": ["unified"],
                "status":  "deleted",
                "unified": true,
                "offset": 0,
                "limit": 250
            }
        },
        multiStatus: {
            "params": {
                "sources": ["unified"],
                "status": ["deleted", "new"],
                "unified": true,
                "offset": 0,
                "limit": 250
            }
        },
        invalidStatus: {
            isError: true
        },
        distantFuture: {
            "total_rows": 0,
            "params": {
                "updated":  "3000-01-01T16:54:12.023Z",
                "sources": [
                    "unified"
                ],
                "offset": 0,
                "limit": 250,
                "unified": true
            }
        },
        distantPast: {
            "params": {
                "updated":  "1970-01-01T16:54:12.023Z",
                "sources": [
                    "unified"
                ],
                "offset": 0,
                "limit": 250,
                "unified": true
            }
        },
        unauthorizedSource: {
            isError: true,
            message: "You do not have permission to view one or more of the sources you requested."
        },
        authorizedSource: {
            "params": {
                "sources": ["~existing"],
                "offset": 0,
                "limit": 250,
                "unified": false
            }
        }
    },
    rawModules: [
        {
            name: "Tests for GET /api/products...",
            tests: [
                {
                    name: "Perform a request with only the endpoint defaults...",
                    type: "test",
                    sequence: [
                        {
                            func: "{defaultRequest}.send"
                        },
                        {
                            event:     "{defaultRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkResults",
                            args:      ["The defaults should return the expected results...", "{that}.options.expected.defaults", "@expand:JSON.parse({arguments}.0)", 1] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{defaultRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Limit the results by page...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstPageRequest}.send"
                        },
                        {
                            event:     "{firstPageRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.products.checkFirstPage",
                            args:      ["@expand:JSON.parse({arguments}.0)", "{firstPageRequest}"] // firstBody, firstRequest
                        },
                        {
                            func: "{secondPageRequest}.send"
                        },
                        {
                            event:     "{secondPageRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.products.checkSecondPage",
                            args:      ["@expand:JSON.parse({arguments}.0)", "{firstPageRequest}"] // secondBody, firstRequest
                        }
                    ]
                },
                {
                    name: "Request a single status using a string...",
                    type: "test",
                    sequence: [
                        {
                            func: "{singleStatusRequest}.send"
                        },
                        {
                            event:     "{singleStatusRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkResultsByStatus",
                            args:      ["Requesting a single status should return the expected results...", "{that}.options.expected.singleStatus", "@expand:JSON.parse({arguments}.0)", 1, ["deleted"]] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{singleStatusRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Request an array of statuses...",
                    type: "test",
                    sequence: [
                        {
                            func: "{multiStatusRequest}.send"
                        },
                        {
                            event:     "{multiStatusRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkResultsByStatus",
                            args:      ["Requesting a single status should return the expected results...", "{that}.options.expected.multiStatus", "@expand:JSON.parse({arguments}.0)", 2, ["deleted", "new"]] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{multiStatusRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Request an invalid status...",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidStatusRequest}.send"
                        },
                        {
                            event:     "{invalidStatusRequest}.events.onComplete",
                            listener:  "jqUnit.assertLeftHand",
                            args:      ["A validation error should have been returned...", "{that}.options.expected.invalidStatus", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 400, "{invalidStatusRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Limit results by 'last updated' field (distant future)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{updatedFutureRequest}.send"
                        },
                        {
                            event:     "{updatedFutureRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkResults",
                            args:      ["The defaults should return the expected results...", "{that}.options.expected.distantFuture", "@expand:JSON.parse({arguments}.0)", 0] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{updatedFutureRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Limit results by 'last updated' field (distant past)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{updatedLongAgoRequest}.send"
                        },
                        {
                            event:     "{updatedLongAgoRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkResults",
                            args:      ["The defaults should return the expected results...", "{that}.options.expected.distantPast", "@expand:JSON.parse({arguments}.0)", 1] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{updatedLongAgoRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Request an unauthorized source...",
                    type: "test",
                    sequence: [
                        {
                            func: "{unauthorizedSourceRequest}.send"
                        },
                        {
                            event:     "{unauthorizedSourceRequest}.events.onComplete",
                            listener:  "jqUnit.assertLeftHand",
                            args:      ["The request should not have been successful...", "{that}.options.expected.unauthorizedSource", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 401, "{unauthorizedSourceRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Request an authorized source...",
                    type: "test",
                    sequence: [
                        {
                            func: "{loginRequest}.send",
                            args: [{ username: "existing", password: "password"}]
                        },
                        {
                            event:     "{loginRequest}.events.onComplete",
                            listener:  "{authorizedSourceRequest}.send"
                        },
                        {
                            event:     "{authorizedSourceRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkResults",
                            args:      ["We should be able to see records from our private source...", "{that}.options.expected.authorizedSource", "@expand:JSON.parse({arguments}.0)", 2] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{authorizedSourceRequest}.nativeResponse.statusCode"]
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
        },
        singleStatusRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?status=%22deleted%22"
            }
        },
        multiStatusRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?status=%5B%22deleted%22,%22new%22%5D"
            }
        },
        invalidStatusRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?status=%22bogus%22"
            }
        },
        updatedFutureRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?updated=%223000-01-01T16:54:12.023Z%22"
            }
        },
        updatedLongAgoRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?updated=%221970-01-01T16:54:12.023Z%22"
            }
        },
        unauthorizedSourceRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?sources=%22~existing%22"
            }
        },
        loginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        authorizedSourceRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?sources=%22~existing%22&unified=false"
            }
        }
    }
});

fluid.defaults("gpii.tests.ul.api.products.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:    9806,
        couch:  6809
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.products.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.products.environment");
