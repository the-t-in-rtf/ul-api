// Test fixtures to confirm that our CORS headers work in actual browsers.
/* globals fluid, jqUnit, QUnit, $ */
"use strict";
(function () {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.tests.ul.api.cors");

    gpii.tests.ul.api.cors.examinePage = function (requestor, message, expected) {
        var containerHtml = $(requestor.container).html();
        jqUnit.assertTrue(QUnit.config.currentModule + ":" + message, containerHtml.indexOf(expected) !== -1);
    };

    fluid.defaults("gpii.tests.ul.api.cors.caseHolder.positive", {
        gradeNames: ["fluid.test.testCaseHolder"],
        expected: {
            before:  "The request object has not performed any updates yet.",
            success: "Success!",
            failure: "Error!"
        },
        modules: [{
            name: "Testing CORS support...",
            tests: [
                {
                    name: "Confirm that we can access an endpoint with the CORS headers from another domain...",
                    type: "test",
                    sequence: [
                        {
                            func: "gpii.tests.ul.api.cors.examinePage",
                            args: ["{testEnvironment}.requestor", "There should be no updates before we make a request.", "{that}.options.expected.before"]
                        },
                        {
                            func: "{testEnvironment}.requestor.makeRequest",
                            args: ["http://localhost:6914/api/product/unified/unifiedNewer"]
                        },
                        {
                            listener: "gpii.tests.ul.api.cors.examinePage",
                            event:    "{testEnvironment}.requestor.events.onRequestComplete",
                            args:     ["{testEnvironment}.requestor", "There should be a success message after we make a request.", "{that}.options.expected.success"]
                        }
                    ]
                }
            ]
        }]
    });

    fluid.defaults("gpii.tests.ul.api.cors.caseHolder.negative", {
        gradeNames: ["fluid.test.testCaseHolder"],
        expected: {
            before:  "The request object has not performed any updates yet.",
            success: "Success!",
            failure: "Error!"
        },
        modules: [{
            name: "Testing CORS failures...",
            tests: [
                {
                    name: "Confirm that we cannot access an endpoint that lacks the CORS headers...",
                    type: "test",
                    sequence: [
                        {
                            func: "gpii.tests.ul.api.cors.examinePage",
                            args: ["{testEnvironment}.requestor", "There should be no updates before we make a request.", "{that}.options.expected.before"]
                        },
                        {
                            func: "{testEnvironment}.requestor.makeRequest",
                            args: ["http://localhost:6914/src/js/client/status.js"]
                        },
                        {
                            listener: "gpii.tests.ul.api.cors.examinePage",
                            event:    "{testEnvironment}.requestor.events.onRequestComplete",
                            args:     ["{testEnvironment}.requestor", "There should be a failure message after we make a request.", "{that}.options.expected.failure"]
                        }
                    ]
                }
            ]
        }]
    });

    // TODO:  Either move to separate markup or encapsulate the tests in separate test environments.
    fluid.defaults("gpii.tests.ul.api.cors.environment.positive", {
        gradeNames:    ["fluid.test.testEnvironment"],
        markupFixture: ".cors-viewport",
        components: {
            requestor: {
                type:      "gpii.test.ul.api.cors.requestor",
                container: "{testEnvironment}.options.markupFixture"
            },
            caseHolder: {
                type: "gpii.tests.ul.api.cors.caseHolder.positive"
            }
        }
    });

    fluid.defaults("gpii.tests.ul.api.cors.environment.negative", {
        gradeNames:    ["fluid.test.testEnvironment"],
        markupFixture: ".cors-viewport",
        components: {
            requestor: {
                type:      "gpii.test.ul.api.cors.requestor",
                container: "{testEnvironment}.options.markupFixture"
            },
            caseHolder: {
                type: "gpii.tests.ul.api.cors.caseHolder.negative"
            }
        }
    });

    fluid.test.runTests("gpii.tests.ul.api.cors.environment.positive");
    fluid.test.runTests("gpii.tests.ul.api.cors.environment.negative");
})();

