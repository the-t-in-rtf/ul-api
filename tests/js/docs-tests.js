/* eslint-env node */
/* Tests to confirm that API documentation is served up. */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../");
gpii.ul.api.loadTestingSupport();

fluid.registerNamespace("gpii.tests.ul.api.docs");

gpii.tests.ul.api.docs.checkResults = function (body) {
    fluid.each(["/api/products", "/api/search", "Unified Listing API"], function (stringToMatch) {
        jqUnit.assertTrue("The output should contain the string '" + stringToMatch + "'...", body.indexOf(stringToMatch) !== -1);
    });
};

fluid.defaults("gpii.tests.ul.api.docs.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    rawModules: [
        {
            name: "Testing GET /api/ (documentation)...",
            tests: [
                {
                    name: "Retrieve the API documentation...",
                    type: "test",
                    sequence: [
                        {
                            func: "{docsRequest}.send"
                        },
                        {
                            event:    "{docsRequest}.events.onComplete",
                            listener: "gpii.tests.ul.api.docs.checkResults",
                            args:     ["{arguments}.0"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args:  ["The correct status code should have been returned...", 200, "{docsRequest}.nativeResponse.statusCode"]
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
        docsRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/"
            }
        }
    }
});

fluid.defaults("gpii.tests.ul.api.docs.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:    9776
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.docs.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.docs.environment");
