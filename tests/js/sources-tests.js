/* eslint-env node */
/* Tests for the "sources" API module */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../../");
gpii.ul.api.loadTestingSupport();

fluid.defaults("gpii.tests.ul.api.sources.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    expected: {
        anonymous: {
            "sources": [
                "ATAust",
                "AZARIM",
                "AbleData",
                "Dlf data",
                "EASTIN Admin",
                "Handicat",
                "Hjælpemiddelbasen",
                "Rehadat",
                "Siva",
                "Vlibank",
                "unified"
            ],
            "writableSources": []
        },
        loggedIn: {
            "sources": [
                "ATAust",
                "AZARIM",
                "AbleData",
                "Dlf data",
                "EASTIN Admin",
                "Handicat",
                "Hjælpemiddelbasen",
                "Rehadat",
                "Siva",
                "Vlibank",
                "unified",
                "~existing"
            ],
            "writableSources": ["~existing"]
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
            type: "gpii.test.ul.api.request.login"
        },
        loggedInRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/sources"
            }
        }
    }
});

fluid.defaults("gpii.tests.ul.api.sources.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api: 9786
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.sources.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.sources.environment");
