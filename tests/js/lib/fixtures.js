// Test fixtures (testEnvironment, testCaseHolder)
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var kettle = require("kettle");
kettle.loadTestingSupport();

require("gpii-express");
gpii.express.loadTestingSupport();

require("gpii-test-browser");
gpii.tests.browser.loadTestingSupport();

require("./test-harness");

fluid.defaults("gpii.ul.api.tests.testCaseHolder", {
    gradeNames: ["gpii.tests.browser.caseHolder.withExpress"]
});

fluid.defaults("gpii.ul.api.tests.testEnvironment", {
    gradeNames: ["gpii.tests.browser.environment.withExpress"],
    components: {
        express: {
            type: "gpii.ul.api.tests.harness"
        }
    }
});

fluid.defaults("gpii.ul.api.tests.request", {
    gradeNames: ["kettle.test.request.httpCookie"],
    path: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["%apiUrl%endpoint", { apiUrl: "{gpii.ul.api.tests.harness}.urls.api", endpoint: "{that}.options.endpoint" }]
        }
    }
});
