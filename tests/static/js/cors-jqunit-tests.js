// Test fixtures to confirm that our CORS headers work in actual browsers.
/* globals fluid, jqUnit, QUnit, $ */
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.tests.ul.api.cors");

    gpii.tests.ul.api.cors.examinePage = function (requestor, message, expected) {
        var container = $(requestor.container);
        var containerHtml = container.html();
        jqUnit.assertTrue(QUnit.config.currentModule + ":" + message, containerHtml.indexOf(expected) !== -1);
    };

    gpii.tests.ul.api.cors.checkStatusCode = function (requestor, message, statusCode) {
        var container = $(requestor.container);
        var statusContainerHtml = container.find(".status").html();
        jqUnit.assertTrue(QUnit.config.currentModule + ":" + message, statusContainerHtml && statusContainerHtml.indexOf(statusCode) !== -1);
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
                            args: ["http://localhost:6194/api/product/unified/1421059432806-826608318"]
                        },
                        {
                            listener: "gpii.tests.ul.api.cors.examinePage",
                            event:    "{testEnvironment}.requestor.events.onRequestComplete",
                            args:     ["{testEnvironment}.requestor", "There should be a success message after we make a request.", "{that}.options.expected.success"]
                        },
                        {
                            func: "gpii.tests.ul.api.cors.checkStatusCode",
                            args: ["{testEnvironment}.requestor", "The status code should indicate success.", 200]
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
                            args: ["http://localhost:6194/src/js/client/transformArray.js"]
                        },
                        {
                            listener: "gpii.tests.ul.api.cors.examinePage",
                            event:    "{testEnvironment}.requestor.events.onRequestComplete",
                            args:     ["{testEnvironment}.requestor", "There should be a failure message after we make a request.", "{that}.options.expected.failure", 0]
                        },
                        {
                            func: "gpii.tests.ul.api.cors.checkStatusCode",
                            args: ["{testEnvironment}.requestor", "The status code should indicate a CORS failure.", 0]
                        }
                    ]
                }
            ]
        }]
    });

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
