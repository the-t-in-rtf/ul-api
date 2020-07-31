/* eslint-env node */
// tests for all read methods
"use strict";
var fluid = require("infusion");
fluid.logObjectRenderChars = 20000;

var gpii  = fluid.registerNamespace("gpii");

fluid.require("%fluid-express/tests/js/lib/test-helpers.js");

var jqUnit = require("node-jqunit");

require("../../../");
gpii.ul.api.loadTestingSupport();

fluid.defaults("gpii.tests.ul.api.product.get.request", {
    gradeNames: ["gpii.test.ul.api.request"],
    method:     "GET"
});

// Wrapper to call the correct functions from the `fluid-express test helpers.
fluid.registerNamespace("gpii.tests.ul.api.product.get");
gpii.tests.ul.api.product.get.verifyContent = function (message, response, body, expected, statusCode) {
    fluid.test.express.helpers.isSaneResponse(response, body, statusCode);
    jqUnit.assertLeftHand(message, expected, body);
};

gpii.tests.ul.api.product.get.verifyRedirect = function (response) {
    jqUnit.assertEquals("The status code should be correct...", 301, response.statusCode);
    jqUnit.assertEquals("The redirect destination should be correct...", "/api/product/unified/mergedOriginal", response.headers.location);
};

fluid.defaults("gpii.tests.ul.api.product.get.caseHolder", {
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
                    name: "Request a unified record with sources from /api/product (not logged in)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestUnifiedRecordWithSourcesAnonymously}.send",
                            args: []
                        },
                        {
                            event:    "{requestUnifiedRecordWithSourcesAnonymously}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should see the unified record...",
                                "{requestUnifiedRecordWithSourcesAnonymously}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.unifiedSourcesAnonymous",
                                200
                            ]
                        }
                    ]
                },
                {
                    name: "Request a unified record with sources from /api/product (logged in)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestUnifiedRecordLogin}.send",
                            args: [{username: "existing", password: "password"}]
                        },
                        {
                            event:    "{requestUnifiedRecordLogin}.events.onComplete",
                            listener: "{requestUnifiedRecordWithSourcesLoggedIn}.send",
                            args:     []
                        },
                        {
                            event:    "{requestUnifiedRecordWithSourcesLoggedIn}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should see the unified record...",
                                "{requestUnifiedRecordWithSourcesLoggedIn}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.unifiedSourcesLoggedIn",
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
                            func: "{requestSourceRecordLogin}.send",
                            args: [{username: "existing", password: "password"}]
                        },
                        {
                            event:    "{requestSourceRecordLogin}.events.onComplete",
                            listener: "{requestSourceRecordWithSources}.send",
                            args:     []
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
                },
                {
                    name: "Request a source record we do not have permission to see...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestPrivateLogout}.send",
                            args: []
                        },
                        {
                            event:    "{requestPrivateLogout}.events.onComplete",
                            listener: "{requestPrivateRecord}.send",
                            args:     []
                        },
                        {
                            event:    "{requestPrivateRecord}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should receive an authorization error...",
                                "{requestPrivateRecord}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.private",
                                401
                            ]
                        }
                    ]
                },
                {
                    name: "Request a duplicate record and confirm that the redirect is appropriate...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestDuplicateRecord}.send",
                            args: []
                        },
                        {
                            event:    "{requestDuplicateRecord}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyRedirect",
                            args:     ["{requestDuplicateRecord}.nativeResponse"]
                        }
                    ]
                },
                {
                    name: "Request a duplicate record with the `noRedirect` option...",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestDuplicateRecordNoRedirect}.send",
                            args: []
                        },
                        {
                            event:    "{requestDuplicateRecordNoRedirect}.events.onComplete",
                            listener: "gpii.tests.ul.api.product.get.verifyContent",
                            // message, response, body, expected, statusCode
                            args:     [
                                "We should have seen the raw duplicate...",
                                "{requestDuplicateRecordNoRedirect}.nativeResponse",
                                "@expand:JSON.parse({arguments}.0)",
                                "{that}.options.expected.duplicateNoRedirect",
                                200
                            ]
                        }
                    ]
                }
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
        requestUnifiedRecordWithSourcesAnonymously: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified/unifiedNewer?includeSources=true"
            }
        },
        requestUnifiedRecordLogin: {
            type: "gpii.test.ul.api.request.login"
        },
        requestUnifiedRecordWithSourcesLoggedIn: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified/unifiedNewer?includeSources=true"
            }
        },
        requestSourceRecordLogin: {
            type: "gpii.test.ul.api.request.login"
        },
        requestSourceRecordWithSources: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/~existing/contrib1?includeSources=true"
            }
        },
        requestPrivateLogout: {
            type: "gpii.test.ul.api.request.logout"
        },
        requestPrivateRecord: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/~existing/contrib1"
            }
        },
        requestDuplicateRecord: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified/mergedDuplicate"
            }
        },
        requestDuplicateRecordNoRedirect: {
            type: "gpii.tests.ul.api.product.get.request",
            options: {
                endpoint: "api/product/unified/mergedDuplicate?noRedirect=true"
            }
        }
    },
    expected: {
        noParams: {
            "isValid": false,
            "statusCode": 400
        },
        oneParam: {
            "isValid": false,
            "statusCode": 400
        },
        missing: {
            isError: true,
            "statusCode": 404,
            message: "Could not find a record matching the specified source and id."
        },
        existing: {
            "uid":          "unifiedNewer",
            "status":       "new",
            "source":       "unified",
            "sid":          "unifiedNewer",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2015-01-01",
            "sources":      []
        },
        unified: {
            "uid":          "unifiedNewer",
            "status":       "new",
            "source":       "unified",
            "sid":          "unifiedNewer",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2015-01-01",
            "sources":      []
        },
        unifiedSourcesAnonymous: {
            "uid":          "unifiedNewer",
            "status":       "new",
            "source":       "unified",
            "sid":          "unifiedNewer",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2015-01-01",
            "sources":      []
        },
        unifiedSourcesLoggedIn: {
            "uid":          "unifiedNewer",
            "status":       "new",
            "source":       "unified",
            "sid":          "unifiedNewer",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2015-01-01",
            "sources": [
                {
                    "uid":          "unifiedNewer",
                    "status":       "new",
                    "source":       "~existing",
                    "sid":          "contrib1",
                    "name":         "sample product 1",
                    "description":  "sample description 1",
                    "manufacturer": { "name": "sample manufacturer 1" },
                    "updated":      "2014-01-01"
                },
                {
                    "uid": "unifiedNewer",
                    "status": "deleted",
                    "source": "~existing",
                    "sid": "contrib5",
                    "name": "sample product 5",
                    "description": "sample description 5",
                    "manufacturer": {
                        "name": "sample manufacturer 5"
                    },
                    "updated": "2014-05-01"
                }
            ]
        },
        source:  {
            "uid":          "unifiedNewer",
            "source":       "~existing",
            "status":       "new",
            "sid":          "contrib1",
            "name":         "sample product 1",
            "description":  "sample description 1",
            "manufacturer": { "name": "sample manufacturer 1" },
            "updated":      "2014-01-01"
        },
        private: {
            isError: true,
            "statusCode": 401,
            message: "You are not authorized to view this record."
        },
        duplicateNoRedirect:         {
            "uid": "mergedOriginal",
            "status": "deleted",
            "source": "unified",
            "sid": "mergedDuplicate",
            "name": "A duplicate...",
            "description": "This record is a duplicate.",
            "manufacturer": {
                "name": "ACME Corp."
            },
            "updated": "2017-08-31",
            "sources": []
        }
    }
});

fluid.defaults("gpii.tests.ul.api.product.get.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api: 9752
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.product.get.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.product.get.environment");
