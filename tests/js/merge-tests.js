/* eslint-env node */
// Tests for POST /api/merge
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = fluid.require("node-jqunit", require, "jqUnit");

require("../../");
gpii.ul.api.loadTestingSupport();

fluid.registerNamespace("gpii.tests.ul.api.merge");

gpii.tests.ul.api.merge.hasCorrectNumberOfChildren = function (message, expectedChildren, record) {
    jqUnit.assertEquals(message, expectedChildren, record.sources.length);
};

fluid.defaults("gpii.test.ul.api.merge.request", {
    gradeNames: "gpii.test.ul.api.request",
    method:     "POST",
    endpoint:   "api/merge"
});

fluid.defaults("gpii.test.ul.api.merge.request.withData", {
    gradeNames: "gpii.test.ul.api.merge.request",
    endpoint:   "api/merge?target=\"%target\"&sources=\"%sources\"",
    termMap: {
        "target": "%target",
        "sources": "%sources"
    }
});


fluid.defaults("gpii.tests.ul.api.merge.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    rawModules: [
        {
            name: "Tests for POST /api/merge...",
            tests: [
                {
                    name: "Perform an anonymous request...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousRequest}.send"
                        },
                        {
                            event:     "{anonymousRequest}.events.onComplete",
                            listener:  "jqUnit.assertEquals",
                            args:      ["We should have been rejected because we were not logged in...", 401, "{anonymousRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Perform a request with no payload..",
                    type: "test",
                    sequence: [
                        {
                            func: "{noPayloadLoginRequest}.send",
                            args: [{ username: "existing", password: "password" }]
                        },
                        {
                            event: "{noPayloadLoginRequest}.events.onComplete",
                            listener: "jqUnit.assertEquals",
                            args: ["The login should have been successful...", 200, "{noPayloadLoginRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func:  "{noPayloadRequest}.send"
                        },
                        {
                            event:     "{noPayloadRequest}.events.onComplete",
                            listener:  "jqUnit.assertEquals",
                            args:      ["We should have been rejected because we did not include the required data...", 400, "{noPayloadRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Try to merge with a target that doesn't exist...",
                    type: "test",
                    sequence: [
                        {
                            func: "{nonExistentTargetLoginRequest}.send",
                            args: [{ username: "importer", password: "password" }]
                        },
                        {
                            event: "{nonExistentTargetLoginRequest}.events.onComplete",
                            listener: "jqUnit.assertEquals",
                            args: ["The login should have been successful...", 200, "{nonExistentTargetLoginRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func: "{nonExistentTargetRequest}.send",
                            args: [{}, { termMap: { target: "foobar", sources: "unmergedDuplicate"}}]
                        },
                        {
                            event:     "{nonExistentTargetRequest}.events.onComplete",
                            listener:  "jqUnit.assertEquals",
                            args:      ["We should have been rejected because the target does not exist ...", 404, "{nonExistentTargetRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Try to merge with a source that doesn't exist...",
                    type: "test",
                    sequence: [
                        {
                            func: "{nonExistentSourceLoginRequest}.send",
                            args: [{ username: "importer", password: "password" }]
                        },
                        {
                            event: "{nonExistentSourceLoginRequest}.events.onComplete",
                            listener: "jqUnit.assertEquals",
                            args: ["The login should have been successful...", 200, "{nonExistentSourceLoginRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func: "{nonExistentSourceRequest}.send",
                            args: [{}, { termMap: { target: "unmergedOriginal", sources: "sourceNotFound"}}]
                        },
                        {
                            event:     "{nonExistentSourceRequest}.events.onComplete",
                            listener:  "jqUnit.assertEquals",
                            args:      ["We should have been rejected because the source does not exist ...", 404, "{nonExistentSourceRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Try to merge without the correct permissions...",
                    type: "test",
                    sequence: [
                        {
                            func: "{missingPermissionLoginRequest}.send",
                            args: [{ username: "existing", password: "password" }]
                        },
                        {
                            event: "{missingPermissionLoginRequest}.events.onComplete",
                            listener: "jqUnit.assertEquals",
                            args: ["The login should have been successful...", 200, "{missingPermissionLoginRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func: "{missingPermissionRequest}.send",
                            args: [{}, { termMap: { target: "unmergedOriginal", sources: "unmergedDuplicate"} }]
                        },
                        {
                            event:     "{missingPermissionRequest}.events.onComplete",
                            listener:  "jqUnit.assertEquals",
                            args:      ["We should have been rejected because our username does not have the right permissions...", 401, "{missingPermissionRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Try to create a merge loop...",
                    type: "test",
                    sequence: [
                        {
                            func: "{mergeLoopLoginRequest}.send",
                            args: [{ username: "importer", password: "password" }]
                        },
                        {
                            event: "{mergeLoopLoginRequest}.events.onComplete",
                            listener: "jqUnit.assertEquals",
                            args: ["The login should have been successful...", 200, "{mergeLoopLoginRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func: "{mergeLoopRequest}.send",
                            args: [{}, { termMap: { target: "mergedDuplicate", sources: "mergedOriginal"} }]
                        },
                        {
                            event:     "{mergeLoopRequest}.events.onComplete",
                            listener:  "jqUnit.assertEquals",
                            args:      ["We should have been rejected because our merge would have created a redirect loop...", 400, "{mergeLoopRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Merge a record succesfully...",
                    type: "test",
                    sequence: [
                        {
                            func: "{mergeLoginRequest}.send",
                            args: [{ username: "importer", password: "password" }]
                        },
                        {
                            event:    "{mergeLoginRequest}.events.onComplete",
                            listener: "jqUnit.assertEquals",
                            args:     ["The login should have been successful...", 200, "{mergeLoginRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func: "{mergeRequest}.send",
                            args: [{}, { termMap: { target: "unmergedOriginal", sources: "unmergedDuplicate"}}]
                        },
                        {
                            event:    "{mergeRequest}.events.onComplete",
                            listener: "jqUnit.assertEquals",
                            args:     ["The merge should have been successful...", 200, "{mergeRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func: "{mergeOriginalCheckRequest}.send"
                        },
                        {
                            event:    "{mergeOriginalCheckRequest}.events.onComplete",
                            listener: "gpii.tests.ul.api.merge.hasCorrectNumberOfChildren",
                            args:     ["The original record should now have the merged record's children.", 2, "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should indicate success...", 200, "{mergeOriginalCheckRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func: "{mergeDupeCheckRequest}.send"
                        },
                        {
                            event:    "{mergeDupeCheckRequest}.events.onComplete",
                            listener: "jqUnit.assertEquals",
                            args:     ["The status code of the duplicate should now indicate that it's a redirect...", 301, "{mergeDupeCheckRequest}.nativeResponse.statusCode"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The response should include the location of the original record...", "/api/product/unified/unmergedOriginal", "{mergeDupeCheckRequest}.nativeResponse.headers.location"]
                        }
                    ]
                }
            ]
        }
    ],
    // Our request components
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        },
        anonymousRequest: {
            type: "gpii.test.ul.api.merge.request.withData"
        },
        noPayloadLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        noPayloadRequest: {
            type: "gpii.test.ul.api.merge.request"
        },
        nonExistentTargetLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        nonExistentTargetRequest: {
            type: "gpii.test.ul.api.merge.request.withData"
        },
        nonExistentSourceLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        nonExistentSourceRequest: {
            type: "gpii.test.ul.api.merge.request.withData"
        },
        missingPermissionLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        missingPermissionRequest: {
            type: "gpii.test.ul.api.merge.request.withData"
        },
        mergeLoopLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        mergeLoopRequest: {
            type: "gpii.test.ul.api.merge.request.withData"
        },
        remergeLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        remergeRequest: {
            type: "gpii.test.ul.api.merge.request.withData"
        },
        mergeLoginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        mergeRequest: {
            type: "gpii.test.ul.api.merge.request.withData"
        },
        mergeOriginalCheckRequest: {
            type: "gpii.test.ul.api.merge.request",
            options: {
                method:   "GET",
                endpoint: "api/product/unified/unmergedOriginal?includeSources=true"
            }
        },
        mergeDupeCheckRequest: {
            type: "gpii.test.ul.api.merge.request",
            options: {
                method:   "GET",
                endpoint: "api/product/unified/unmergedDuplicate"
            }
        }
    }
});

fluid.defaults("gpii.tests.ul.api.merge.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api: 9816
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.merge.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.merge.environment");
