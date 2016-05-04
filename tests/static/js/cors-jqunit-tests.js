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

    fluid.defaults("gpii.tests.ul.api.cors.caseHolder", {
        gradeNames: ["fluid.test.testCaseHolder"],
        expected: {
            before: "The request object has not performed any updates yet.",
            after:  "Success!"
        },
        modules: [{
            name: "Testing CORS support...",
            tests: [
                {
                    name: "Confirm that we can access the UL API from another domain...",
                    type: "test",
                    sequence: [
                        {
                            func: "gpii.tests.ul.api.cors.examinePage",
                            args: ["{testEnvironment}.requestor", "There should be no updates before we make a request.", "{that}.options.expected.before"]
                        },
                        {
                            func: "{testEnvironment}.requestor.makeRequest"
                        },
                        {
                            listener: "gpii.tests.ul.api.cors.examinePage",
                            event:    "{testEnvironment}.requestor.events.onRequestComplete",
                            args:     ["{testEnvironment}.requestor", "There should be a success message after we make a request.", "{that}.options.expected.after"]
                        }
                    ]
                }
            ]
        }]
    });

    fluid.defaults("gpii.tests.ul.api.cors.environment", {
        gradeNames:    ["fluid.test.testEnvironment"],
        markupFixture: ".cors-viewport",
        components: {
            requestor: {
                type:      "gpii.test.ul.api.cors.requestor",
                container: "{gpii.tests.ul.api.cors.environment}.options.markupFixture"
            },
            caseHolder: {
                type: "gpii.tests.ul.api.cors.caseHolder"
            }
        }
    });

    gpii.tests.ul.api.cors.environment();
})();

