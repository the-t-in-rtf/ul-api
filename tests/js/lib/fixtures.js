/* eslint-env node */
// Test fixtures (testEnvironment, testCaseHolder)
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var kettle = fluid.require("%kettle");
kettle.loadTestingSupport();

require("gpii-express");
gpii.express.loadTestingSupport();

require("./test-harness");

// A caseholder for tests that do not require a browser (browser tests can use gpii.test.webdriver.caseHolder).
fluid.defaults("gpii.test.ul.api.caseHolder", {
    gradeNames: ["gpii.test.express.caseHolder.base"],
    sequenceStart: gpii.test.express.standardSequenceStart,
    sequenceEnd: [
        { func: "{testEnvironment}.events.stopFixtures.fire", args: [] },
        { listener: "fluid.identity", event: "{testEnvironment}.events.onFixturesStopped"}
    ]
});


// An environment for tests that don't require lucene (it's faster).
fluid.defaults("gpii.test.ul.api.testEnvironment", {
    gradeNames: ["gpii.test.express.testEnvironment", "gpii.tests.ul.api.harness"],
    port: "{that}.options.ports.api"
});


// An environment for tests that require lucene.
fluid.defaults("gpii.test.ul.api.testEnvironment.withLucene", {
    gradeNames: ["gpii.test.express.testEnvironment", "gpii.tests.ul.api.harness.withLucene"],
    hangWait:   7500,
    events: {
        onFixturesConstructed: {
            events: {
                apiReady:      "apiReady",
                luceneStarted: "luceneStarted",
                pouchStarted:  "pouchStarted"
            }
        },
        onFixturesStopped: {
            events: {
                apiStopped:    "apiStopped",
                luceneStopped: "luceneStopped",
                pouchStopped:  "pouchStopped"
            }
        }
    }
});

// Use this request grade to get JSON payloads.
fluid.defaults("gpii.test.ul.api.request", {
    gradeNames: ["kettle.test.request.httpCookie"],
    port:       "{testEnvironment}.options.ports.api",
    headers: {
        accept: "application/json"
    },
    path: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["%apiUrl%endpoint", { apiUrl: "{testEnvironment}.options.baseUrl", endpoint: "{that}.options.endpoint" }]
        }
    }
});

// Use this request grade if you want to see HTML responses.
fluid.defaults("gpii.test.ul.api.request.html", {
    gradeNames: ["gpii.test.ul.api.request"],
    headers: {
        accept: "text/html"
    }
});


// Many of our tests require a login, so we have one with the right endpoint and method as a convenience.
fluid.defaults("gpii.test.ul.api.request.login", {
    gradeNames: ["gpii.test.ul.api.request"],
    method:     "POST",
    endpoint:   "api/user/login"
});

