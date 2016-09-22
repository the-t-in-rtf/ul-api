/* eslint-env node */
/* Tests for the "updates" API module */
"use strict";

var fluid        = fluid || require("infusion");
var gpii         = fluid.registerNamespace("gpii");

require("../../");
gpii.ul.api.loadTestingSupport();

// Each test has a request instance of `kettle.test.request.http` or `kettle.test.request.httpCookie`, and a test module that wires the request to the listener that handles its results.
fluid.defaults("gpii.tests.ul.api.updates.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    expected: {
        anonymous: {
            isError: true,
            statusCode: 401
        },
        unifiedNewer: {
            "total_rows": 1,
            "params": {
                "sources": "~existing"
            },
            "products": [
                {
                    "uid": "unifiedNewer",
                    "source": "unified",
                    "status": "new",
                    "sid": "unifiedNewer",
                    "name": "sample product 1",
                    "description": "sample description 1",
                    "updated": "2015-01-01",
                    "manufacturer": {
                        "name": "sample manufacturer 1"
                    },
                    "sources": [
                        {
                            "uid": "unifiedNewer",
                            "status": "new",
                            "source": "~existing",
                            "sid": "contrib1",
                            "name": "sample product 1",
                            "description": "sample description 1",
                            "updated": "2014-01-01",
                            "manufacturer": {
                                "name": "sample manufacturer 1"
                            }
                        },
                        {
                            "uid": "unifiedNewer",
                            "status": "new",
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
                }
            ]
        },
        unifiedSpecified: {
            "total_rows": 1,
            "params": {
                "sources": ["~existing", "unified"]
            },
            "products": [
                {
                    "uid": "unifiedNewer",
                    "source": "unified",
                    "status": "new",
                    "sid": "unifiedNewer",
                    "name": "sample product 1",
                    "description": "sample description 1",
                    "updated": "2015-01-01",
                    "manufacturer": {
                        "name": "sample manufacturer 1"
                    },
                    "sources": [
                        {
                            "uid": "unifiedNewer",
                            "status": "new",
                            "source": "~existing",
                            "sid": "contrib1",
                            "name": "sample product 1",
                            "description": "sample description 1",
                            "updated": "2014-01-01",
                            "manufacturer": {
                                "name": "sample manufacturer 1"
                            }
                        },
                        {
                            "uid": "unifiedNewer",
                            "status": "new",
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
                }
            ]
        },
        sourceNewer: {
            "total_rows": 1,
            "params": {
                "sources": "~existing",
                "sourceNewer": true
            },
            "products": [
                {
                    "uid": "unifiedOlder",
                    "source": "unified",
                    "sid": "unifiedOlder",
                    "status": "new",
                    "name": "sample product 2",
                    "description": "sample description 2",
                    "updated": "2013-01-01",
                    "manufacturer": {
                        "name": "sample manufacturer 2"
                    },
                    "sources": [
                        {
                            "uid": "unifiedOlder",
                            "source": "~existing",
                            "status": "new",
                            "sid": "contrib2",
                            "name": "sample product 2",
                            "description": "sample description 2",
                            "updated": "2014-01-01",
                            "manufacturer": {
                                "name": "sample manufacturer 2"
                            }
                        }
                    ]
                }
            ]
        },
        updatedSince: {
            "total_rows": 0,
            "params": {
                "sources": "~existing",
                "updatedSince": "3000-01-01"
            },
            "products": []
        }
    },
    rawModules: [
        {
            name: "Testing the /api/updates endpoint...",
            tests: [
                {
                    name: "Request a report anonymously...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousRequest}.send"
                        },
                        {
                            event:    "{anonymousRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should receive a permission error...", "{that}.options.expected.anonymous", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should be as expected...", 401, "{anonymousRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Looking for products where the source is newer than the unified record...",
                    type: "test",
                    sequence: [
                        {
                            func: "{sourceNewerLoginRequest}.send",
                            args: [{ username: "existing", password: "password"}]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{sourceNewerLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{sourceNewerRequest}.send"
                        },
                        {
                            event:    "{sourceNewerRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should see clusters in which the source record is newer...", "{that}.options.expected.sourceNewer", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should be as expected...", 200, "{sourceNewerRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Looking for products where the unified record is newer than the source record...",
                    type: "test",
                    sequence: [
                        {
                            func: "{unifiedNewerLoginRequest}.send",
                            args: [{ username: "existing", password: "password" }]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{unifiedNewerLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{unifiedNewerRequest}.send"
                        },
                        {
                            event:    "{unifiedNewerRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should see clusters in which the unified record is newer...", "{that}.options.expected.unifiedNewer", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should be as expected...", 200, "{unifiedNewerRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Limiting the results using the 'updatedSince' parameter...",
                    type: "test",
                    sequence: [
                        {
                            func: "{updatedSinceLoginRequest}.send",
                            args: [{ username: "existing", password: "password" }]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{updatedSinceLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{updatedSinceRequest}.send"
                        },
                        {
                            event:    "{updatedSinceRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["There should no longer be results in the distant future...", "{that}.options.expected.updatedSince", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should be as expected...", 200, "{updatedSinceRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Specify 'unified' as one of the sources...",
                    type: "test",
                    sequence: [
                        {
                            func: "{unifiedSpecifiedLoginRequest}.send",
                            args: [{ username: "existing", password: "password"}]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{unifiedSpecifiedLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{unifiedSpecifiedRequest}.send"
                        },
                        {
                            event:    "{unifiedSpecifiedRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["The results should not change if we add 'unified' to the list of sources...", "{that}.options.expected.unifiedSpecified", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should be as expected...", 200, "{unifiedSpecifiedRequest}.nativeResponse.statusCode"]
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
        anonymousRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/updates?sources=%22~existing%22"
            }
        },
        sourceNewerLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        sourceNewerRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/updates?sources=%22~existing%22&sourceNewer=true"
            }
        },
        unifiedNewerLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        unifiedNewerRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/updates?sources=%22~existing%22"
            }
        },
        unifiedSpecifiedLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        unifiedSpecifiedRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/updates?sources=%5B%22~existing%22%2C%22unified%22%5D"
            }
        },
        updatedSinceLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        updatedSinceRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/updates?sources=%22~existing%22&updatedSince=%223000-01-01%22"
            }
        }
    }
});

fluid.defaults("gpii.tests.ul.api.updates.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:    9786,
        couch:  6879
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.updates.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.updates.environment");
