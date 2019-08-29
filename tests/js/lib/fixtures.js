/* eslint-env node */
// Test fixtures (testEnvironment, testCaseHolder)
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var kettle = fluid.require("%kettle");
kettle.loadTestingSupport();

fluid.require("%gpii-couchdb-test-harness");
gpii.test.couchdb.loadTestingSupport();

require("./test-harness");

// Wire API harness startup and shutdown into existing sequences inherited from gpii-couchdb-test-harness.
fluid.defaults("gpii.test.ul.api.sequenceElement.provision", {
    gradeNames: "fluid.test.sequenceElement",
    sequence: [{
        // TODO: Tidy up this IoC reference when potentia ii is merged.
        task:        "{gpii.test.ul.api.testEnvironment}.apiHarness.provisioner.provision",
        resolve:     "fluid.log",
        resolveArgs: ["Test image data provisioned."]
    }]
});

fluid.defaults("gpii.test.ul.api.sequenceElement.cleanup", {
    gradeNames: "fluid.test.sequenceElement",
    sequence: [{
        // TODO: Tidy up this IoC reference when potentia ii is merged.
        task:        "{gpii.test.ul.api.testEnvironment}.apiHarness.provisioner.cleanup",
        resolve:     "fluid.log",
        resolveArgs: ["Test image data cleaned up."]
    }]
});

fluid.defaults("gpii.test.ul.api.sequence", {
    gradeNames: "gpii.test.couchdb.sequence",
    sequenceElements: {
        provision: {
            gradeNames: "gpii.test.ul.api.sequenceElement.provision",
            priority:   "after:startHarness"
        },
        cleanup: {
            gradeNames: "gpii.test.ul.api.sequenceElement.cleanup",
            priority:   "before:stopHarness"
        }
    }
});

fluid.defaults("gpii.test.ul.api.caseHolder", {
    gradeNames: ["gpii.test.couchdb.caseHolder"],
    sequenceGrade: "gpii.test.ul.api.sequence"
});

fluid.defaults("gpii.test.ul.api.testEnvironment", {
    gradeNames: ["gpii.test.couchdb.lucene.environment"],
    hangWait:   7500,
    databases: {
        users: { data: "%ul-api/tests/data/users.json" },
        ul:    {
            data: [
                "%ul-api/tests/data/deleted.json",
                "%ul-api/tests/data/duplicates.json",
                "%ul-api/tests/data/pilot.json",
                "%ul-api/tests/data/updates.json",
                "%ul-api/tests/data/views.json",
                "%ul-api/tests/data/whetstone.json"
            ]
        },
        images: {
            data: [
                "%ul-api/tests/data/galleries.json",
                "%ul-api/tests/data/images.json"
            ]
        }
    },
    components: {
        apiHarness: {
            type: "gpii.tests.ul.api.harness",
            options: {
                ports: {
                    api:  "{testEnvironment}.options.ports.api",
                    couch:  25984,
                    lucene: 25985
                }
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
            args:     ["%apiUrl%endpoint", { apiUrl: "{testEnvironment}.apiHarness.options.urls.api", endpoint: "{that}.options.endpoint" }]
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

// Some tests need to ensure that we are not already logged in.
fluid.defaults("gpii.test.ul.api.request.logout", {
    gradeNames: ["gpii.test.ul.api.request"],
    method:     "GET",
    endpoint:   "api/user/logout"
});
