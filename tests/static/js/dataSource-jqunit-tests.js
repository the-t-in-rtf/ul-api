// Test fixtures to confirm that kettle.dataSource.URL works in actual browsers.
/* globals fluid, jqUnit */
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.tests.ul.api.dataSource");

    gpii.tests.ul.api.dataSource.checkResponse = function (response) {
        jqUnit.assertDeepEq("The response should be as expected...", { foo: "bar"}, response);
        return response;
    };

    gpii.tests.ul.api.dataSource.checkNonJSONError = function (error) {
        jqUnit.assertTrue("The error should complain about not being able to parse the payload...", error.message && error.message.indexOf("Parse error") !== -1);
    };

    gpii.tests.ul.api.dataSource.checkFourOhFourError = function (error) {
        jqUnit.assertEquals("The status code should be as expected...", 404, error.statusCode);
        jqUnit.assertTrue("The error should complain about the page being missing...", error.message && error.message.indexOf("Not found") !== -1);
    };

    fluid.defaults("gpii.tests.ul.api.dataSource.caseHolder", {
        gradeNames: ["fluid.test.testCaseHolder"],
        modules: [
            {
                name: "Test kettle.dataSource.URL in-browser read...",
                tests: [
                    {
                        name: "Confirm that we can successfully request http content...",
                        type: "test",
                        sequence: [
                            {
                                func: "{httpGoodRequest}.get",
                                args: []
                            },
                            {
                                listener: "gpii.tests.ul.api.dataSource.checkResponse",
                                event:    "{httpGoodRequest}.events.onRead",
                                args:     ["{arguments}.0"]
                            }
                        ]
                    }
                ]
            },
            {
                name: "Test kettle.dataSource.URL in-browser payload error...",
                tests: [
                    {
                        name: "Confirm that bad payloads result in an `onError` event...",
                        type: "test",
                        sequence: [
                            {
                                func: "{httpNonJsonRequest}.get",
                                args: []
                            },
                            {
                                listener: "gpii.tests.ul.api.dataSource.checkNonJSONError",
                                event:    "{httpNonJsonRequest}.events.onError",
                                args:     ["{arguments}.0"]
                            }
                        ]
                    }
                ]
            },
            {
                name: "Test kettle.dataSource.URL 404 error...",
                tests: [
                    {
                        name: "Confirm that a 404 error results in an `onError` event...",
                        type: "test",
                        sequence: [
                            {
                                func: "{httpFourOhFourRequest}.get",
                                args: []
                            },
                            {
                                listener: "gpii.tests.ul.api.dataSource.checkFourOhFourError",
                                event:    "{httpFourOhFourRequest}.events.onError",
                                args:     ["{arguments}.0"]
                            }
                        ]
                    }
                ]
            }
        ],
        components: {
            httpGoodRequest: {
                type: "kettle.dataSource.URL",
                options: {
                    url: "http://localhost:7357/tests/data/dataSource-payload.json"
                }
            },
            httpNonJsonRequest: {
                type: "kettle.dataSource.URL",
                options: {
                    url: "http://localhost:7357/"
                }
            },
            httpFourOhFourRequest: {
                type: "kettle.dataSource.URL",
                options: {
                    url: "http://localhost:7357/notfound"
                }
            }
        }
    });

    fluid.defaults("gpii.tests.ul.api.dataSource.environment", {
        gradeNames:    ["fluid.test.testEnvironment"],
        components: {
            caseHolder: {
                type: "gpii.tests.ul.api.dataSource.caseHolder"
            }
        }
    });

    fluid.test.runTests("gpii.tests.ul.api.dataSource.environment");
})();
