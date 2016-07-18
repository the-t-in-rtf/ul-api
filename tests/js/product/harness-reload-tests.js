/* eslint-env node */
/* Tests to confirm that our test harness can be safely reloaded over the course of multiple tests. */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../lib/fixtures");

require("gpii-express");
gpii.express.loadTestingSupport();

fluid.defaults("gpii.tests.ul.harness.reload.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    rawModules:  [{
        name: "Testing combined harness through multiple reloads...",
        tests: [
            {
                name: "Perform a sample search...",
                type: "test",
                sequence: [
                    {
                        func: "{searchRequest}.send",
                        args: []
                    },
                    {
                        event:    "{searchRequest}.events.onComplete",
                        listener: "gpii.test.express.helpers.isSaneResponse",
                        args:     ["{searchRequest}.nativeResponse", "{arguments}.0", 200] // response, body, status
                    }
                ]
            }
        ]
    }],
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        },
        searchRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22braille%22"
            }
        }
    }
});

fluid.defaults("gpii.tests.ul.harness.reload.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:    9752,
        pouch:  3578,
        lucene: 5927
    }
});

// Run multiple iterations to confirm that our startup /teardown cycle is working correctly.
for (var iteration = 1; iteration <= 4; iteration++) {
    var caseHolderGrade = "gpii.tests.ul.harness.reload.caseHolder" + iteration;
    fluid.defaults(caseHolderGrade, {
        gradeNames: ["gpii.tests.ul.harness.reload.caseHolder"],
        distributeOptions: {
            record: "Testing harness reload (iteration " + iteration + ")...",
            target: "{that}.options.rawModules.0.name"
        }
    });

    var environmentGrade = "gpii.tests.ul.harness.reload.environment" + iteration;
    fluid.defaults(environmentGrade, {
        gradeNames: "gpii.tests.ul.harness.reload.environment",
        components: {
            testCaseHolder: {
                type: caseHolderGrade
            }
        }
    });

    fluid.test.runTests(environmentGrade);
}

