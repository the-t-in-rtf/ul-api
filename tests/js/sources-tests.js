/* eslint-env node */
/* Tests for the "sources" API module */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../../");
gpii.ul.api.loadTestingSupport();

// Each test has a request instance of `kettle.test.request.http` or `gpii.test.ul.api.request`, and a test module that wires the request to the listener that handles its results.
fluid.defaults("gpii.ul.api.tests.sources.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    expected: {
        anonymous: {
            "sources": [
                "unified"
            ]
        },
        loggedIn: {
            "sources": [
                "unified",
                "~existing"
            ]
        }
    },
    rawModules: [
        {
            name: "Testing GET /api/sources...",
            tests: [
                {
                    name: "Request a list of sources (not logged in)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousRequest}.send"
                        },
                        {
                            event:    "{anonymousRequest}.events.onComplete",
                            listener: "jqUnit.assertDeepEq",
                            args:     ["The results should be as expected...", "{that}.options.expected.anonymous", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{anonymousRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Request a list of sources (logged in)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{loginRequest}.send",
                            args: [{ username: "existing", password: "password" }]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{loginRequest}.events.onComplete"
                        },
                        {
                            func: "{loggedInRequest}.send"
                        },
                        {
                            event:    "{loggedInRequest}.events.onComplete",
                            listener: "jqUnit.assertDeepEq",
                            args:     ["The response should be as expected...", "{that}.options.expected.loggedIn", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should be as expected...", 200, "{loggedInRequest}.nativeResponse.statusCode"]
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
                endpoint: "api/sources"
            }
        },
        loginRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/user/login",
                method:   "POST"
            }
        },
        loggedInRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/sources"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.tests.sources.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:    9786,
        couch:  6879
    },
    components: {
        testCaseHolder: {
            type: "gpii.ul.api.tests.sources.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.ul.api.tests.sources.environment");
