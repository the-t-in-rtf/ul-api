// Common testSequence grades for use in our tests.
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("./request");

// A "marker" grade to allow a sequence to expose a single cookie jar to all requests within sequences and elements.
fluid.defaults("gpii.tests.ul.api.images.needsCookieJar", {
    gradeNames: ["fluid.component"]
});

fluid.registerNamespace("gpii.tests.ul.api.images.elements.loadAndCheck");

gpii.tests.ul.api.images.elements.loadAndCheck.checkResponseBody = function (message, expected, body) {
    if (expected !== undefined && expected !== null) {
        jqUnit.assertLeftHand(message, expected, body);
    }
};

// A general sequence element to load a particular URL and check its response and status code.
// NOTE: You must distribute a cookieJar to this grade if you wish for it to be aware of session cookies et cetera.
fluid.defaults("gpii.tests.ul.api.images.elements.loadAndCheck", {
    gradeNames: ["fluid.test.sequenceElement", "gpii.hasRequiredOptions", "gpii.tests.ul.api.images.needsCookieJar"],
    requiredFields: {
        "endpoint":               true, // The environment-relative path to open with our request.
        "expectedResponseStatus": true // The expected status code of the response.
    },
    sequence: [
        {
            func: "{request}.send",
            args: ["{that}.options.payload"]
        },
        {
            event:    "{request}.events.onComplete",
            listener: "jqUnit.assertLeftHand",
            args:     ["The response body should be as expected...", "{that}.options.expectedResponseBody", "{arguments}.0"]
        },
        {
            event:    "{request}.events.onComplete",
            listener: "jqUnit.assertEquals",
            args:     ["The response status code should be as expected...", "{that}.options.expectedResponseStatus", "{request}.nativeResponse.statusCode"]
        }
    ],
    components: {
        request: {
            type: "gpii.tests.ul.api.images.request",
            options: {
                endpoint: "{gpii.tests.ul.api.images.elements.loadAndCheck}.options.endpoint"
            }
        }
    }
});

// An extension of the above "load and check" sequenceElement that uses the gpii-express-user API to log in.
fluid.defaults("gpii.tests.ul.api.images.elements.login", {
    gradeNames: ["gpii.tests.ul.api.images.elements.loadAndCheck"],
    endpoint: "/api/user/login",
    username: "contributor",
    password: "password",
    payload: { username: "{that}.options.username", password: "{that}.options.password" },
    expectedResponseStatus: 200,
    expectedResponseBody: { message: "You have successfully logged in." },
    components: {
        request: {
            options: {
                "method": "POST"
            }
        }
    }
});

// A grade that provides the same cookie jar to all children with the `gpii.tests.ul.api.images.needsCookieJar` marker grade.
fluid.defaults("gpii.tests.ul.api.images.hasCookieJar", {
    gradeNames: "fluid.component",
    distributeOptions: [{
        record: "{that}.cookieJar",
        target: "{that gpii.tests.ul.api.images.needsCookieJar}.options.components.cookieJar"
    }],
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        }
    }
});

/*

    A grade for use with tests that require a login. Sequences extending this one should start their tests after
    the "login" priority, at which point the user should already be logged in and have a session cookie.

 */
// TODO: Update to work with standard gpii-couchdb-test-harness sequence.
fluid.defaults("gpii.tests.ul.api.images.sequences.requiresLogin", {
    gradeNames: ["gpii.tests.ul.api.images.sequences.standardStartupAndShutdown", "gpii.tests.ul.api.images.hasCookieJar"],
    sequenceElements: {
        login: {
            gradeNames: "gpii.tests.ul.api.images.elements.login",
            priority: "after:startup"
        }
    }
});
