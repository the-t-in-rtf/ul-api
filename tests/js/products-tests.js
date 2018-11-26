/* eslint-env node */
// Tests for GET /api/product
"use strict";
var fluid = require("infusion");

fluid.logObjectRenderChars = 2048;

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

gpii.tests.ul.api.checkResultsBySource = function (message, expected, actual, minRecords, sources) {
    gpii.tests.ul.api.checkResults(message, expected, actual, minRecords);

    var recordsWithWrongSource = 0;
    fluid.each(actual.products, function (record) {
        recordsWithWrongSource += sources.indexOf(record.source) !== -1 ? 0 : 1;
    });

    jqUnit.assertEquals(message + " (no records with the wrong status)", 0, recordsWithWrongSource);
};

gpii.tests.ul.api.checkResultsByStatus = function (message, expected, actual, minRecords, statuses) {
    gpii.tests.ul.api.checkResults(message, expected, actual, minRecords);

    var recordsWithWrongStatus = 0;
    fluid.each(actual.products, function (record) {
        recordsWithWrongStatus += statuses.indexOf(record.status) !== -1 ? 0 : 1;
    });

    jqUnit.assertEquals(message + " (no records with the wrong status)", 0, recordsWithWrongStatus);
};

gpii.tests.ul.api.checkUnifiedRecords = function (body) {
    jqUnit.assertTrue("There should be records...", body.products.length > 100);
    var hasSourceRecords = false;
    fluid.each(body.products, function (product) {
        if (product.sources) {
            hasSourceRecords = true;
        }
    });

    jqUnit.assertTrue("At least one unified record should have source records...", hasSourceRecords);
};

gpii.tests.ul.api.products.defaultSources = [
    "ATAust",
    "AbleData",
    "EASTIN Admin",
    "Handicat",
    "Hjælpemiddelbasen",
    "Rehadat",
    "Siva",
    "Vlibank",
    "unified"
];

fluid.defaults("gpii.tests.ul.api.products.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    expected: {
        defaults: {
            "params": {
                "sources": gpii.tests.ul.api.products.defaultSources,
                "unified": true,
                "offset": 0,
                "sortBy": "/name",
                "limit": 250
            }
        },
        loggedIn: {
            "sources": gpii.tests.ul.api.products.defaultSources.concat("~existing")
        },
        singleStatus: {
            "params": {
                "sources": gpii.tests.ul.api.products.defaultSources,
                "status":  "deleted",
                "unified": true,
                "offset": 0,
                "sortBy": "/name",
                "limit": 250
            }
        },
        multiStatus: {
            "params": {
                "sources": gpii.tests.ul.api.products.defaultSources,
                "status": ["deleted", "new"],
                "unified": true,
                "offset": 0,
                "sortBy": "/name",
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
                "sources": gpii.tests.ul.api.products.defaultSources,
                "offset": 0,
                "limit": 250,
                "sortBy": "/name",
                "unified": true
            }
        },
        distantPast: {
            "params": {
                "updated":  "1970-01-01T16:54:12.023Z",
                "sources": gpii.tests.ul.api.products.defaultSources,
                "offset": 0,
                "limit": 250,
                "sortBy": "/name",
                "unified": true
            }
        },
        unauthorizedSource: {
            isError: true,
            message: "You do not have permission to view one or more of the sources you requested."
        },
        authorizedSource: {
            "total_rows": 3,
            "params": {
                "sources": [ "~existing" ],
                "offset": 0,
                "limit": 250,
                "sortBy": "/name",
                "unified": false
            }
        },
        sourceAndStatus: {
            "total_rows": 1,
            "params": {
                "sources": [ "~existing" ],
                "status":  "deleted",
                "offset": 0,
                "sortBy": "/name",
                "limit": 250,
                "unified": false
            }
        },
        newestUnified: {
            "params": {
                "offset":  0,
                "limit":   1,
                "unified": false,
                "sortBy": "\\updated",
                "sources": ["unified"]
            },
            products: [{
                "uid": "futureKind",
                "status": "new",
                "source": "unified",
                "sid": "futureKind",
                "name": "A record ahead of its time.",
                "description": "The skies are made of diamonds.",
                "manufacturer": {
                    "name": "Professor Yana"
                },
                "updated": "3000-01-01"
            }]
        },
        oldestUnified: {
            "params": {
                "offset":  0,
                "limit":   1,
                "unified": false,
                "sortBy": "updated",
                "sources": ["unified"]
            },
            products: [{
                "source": "unified",
                "sid": "1421059432813-849447471",
                "uid": "1421059432813-849447471",
                "status": "new",
                "name": "TEXTHELP - READ&WRITE",
                "description": "Read&Write GOLD integrates with familiar applications (i.e. Microsoft Word, Internet Explorer, and Adobe Reader) giving access to features for reading, writing, and research support from within programs used every day.<br /><br />Technical details:<br />REPORTED WITHIN THE RESEARCH PROJECT<br />Cloud4All",
                "manufacturer": {
                    "name": "TEXTHELP SYSTEM INC",
                    "cityTown": "Woburn",
                    "country": "UNITED STATES",
                    "email": "u.s.info@texthelp.com",
                    "url": "http://www.texthelp.com"
                },
                "ontologies": {
                    "iso9999": {
                        "IsoCodePrimary": {
                            "Code": "22.30.03",
                            "Name": "Reading materials with audible output"
                        },
                        "IsoCodesOptional": []
                    }
                },
                "updated": "2008-11-23T23:00:00.000Z"
            }]
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
                            args:      ["Requesting multiple statuses should return the expected results...", "{that}.options.expected.multiStatus", "@expand:JSON.parse({arguments}.0)", 2, ["deleted", "new"]] //  message, expected, actual, minRecords
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
                            func: "{authorizedSourceLoginRequest}.send",
                            args: [{ username: "existing", password: "password"}]
                        },
                        {
                            event:     "{authorizedSourceLoginRequest}.events.onComplete",
                            listener:  "{authorizedSourceRequest}.send"
                        },
                        {
                            event:     "{authorizedSourceRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkResultsBySource",
                            args:      ["We should be able to see records from our private source...", "{that}.options.expected.authorizedSource", "@expand:JSON.parse({arguments}.0)", 2, ["~existing"]] // message, expected, actual, minRecords, sources
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{authorizedSourceRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Use both a source and status in a single query...",
                    type: "test",
                    sequence: [
                        {
                            func: "{sourceAndStatusLoginRequest}.send",
                            args: [{ username: "existing", password: "password"}]
                        },
                        {
                            event:     "{sourceAndStatusLoginRequest}.events.onComplete",
                            listener:  "{sourceAndStatusRequest}.send"
                        },
                        {
                            event:     "{sourceAndStatusRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkResultsBySource",
                            args:      ["We should be able to see our private deleted record...", "{that}.options.expected.sourceAndStatus", "@expand:JSON.parse({arguments}.0)", 1, ["~existing"]] // message, expected, actual, minRecords, sources
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{sourceAndStatusRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Request a set of unified records...",
                    type: "test",
                    sequence: [
                        {
                            func: "{unifiedRequest}.send"
                        },
                        {
                            event:     "{unifiedRequest}.events.onComplete",
                            listener:  "gpii.tests.ul.api.checkUnifiedRecords",
                            args:      ["@expand:JSON.parse({arguments}.0)"] // body
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{unifiedRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Use sort parameters to get the newest unified record...",
                    type: "test",
                    sequence: [
                        {
                            func: "{newestUnifiedRequest}.send"
                        },
                        {
                            event:     "{newestUnifiedRequest}.events.onComplete",
                            listener:  "jqUnit.assertLeftHand",
                            args:      ["The newest record should have been returned...", "{that}.options.expected.newestUnified", "@expand:JSON.parse({arguments}.0)"] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{newestUnifiedRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Use sort parameters to get the oldest unified record...",
                    type: "test",
                    sequence: [
                        {
                            func: "{oldestUnifiedRequest}.send"
                        },
                        {
                            event:     "{oldestUnifiedRequest}.events.onComplete",
                            listener:  "jqUnit.assertLeftHand",
                            args:      ["The oldest record should have been returned...", "{that}.options.expected.oldestUnified", "@expand:JSON.parse({arguments}.0)"] //  message, expected, actual, minRecords
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{oldestUnifiedRequest}.nativeResponse.statusCode"]
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
        authorizedSourceLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        authorizedSourceRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?sources=%22~existing%22&unified=false"
            }
        },
        sourceAndStatusLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        sourceAndStatusRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?sources=%22~existing%22&unified=false&status=%22deleted%22"
            }
        },
        unifiedRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?sources=%22Vlibank%22"
            }
        },
        newestUnifiedRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?sortBy=%22%5C%5Cupdated%22&limit=1&unified=false&sources=%22unified%22"
            }
        },
        oldestUnifiedRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/products?sortBy=%22updated%22&limit=1&unified=false&sources=%22unified%22"
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
