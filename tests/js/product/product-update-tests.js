/* eslint-env node */
// tests for POST /api/product
"use strict";
var fluid       = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../../");
gpii.ul.api.loadTestingSupport();

fluid.registerNamespace("gpii.tests.ul.api.product.updates");

gpii.tests.ul.api.product.updates.verifyRecordUpdated = function (expectedRecord, actualRecord) {
    jqUnit.assertLeftHand("The record should have been updated...", expectedRecord, actualRecord);

    var fiveMinutesAgo = new Date(Date.now() - 300000);
    var dateUpdated = new Date(actualRecord.updated);
    jqUnit.assertTrue("The record should have been flagged as having been updated in the last five minutes", dateUpdated > fiveMinutesAgo);
};

fluid.defaults("gpii.tests.ul.api.product.post.request", {
    gradeNames: ["gpii.test.ul.api.request"],
    method:     "POST",
    endpoint:   "api/product"
});

gpii.tests.ul.api.product.post.commonTests = [
    {
        name: "Try to create a valid record without logging in...",
        type: "test",
        sequence: [
            {
                func: "{anonymousCreate}.send",
                args: ["{that}.options.inputs.validNewRecord"]
            },
            {
                event:    "{anonymousCreate}.events.onComplete",
                listener: "jqUnit.assertLeftHand",
                args:     ["We should have received an authorization error.", { isError: true, statusCode: 401, message: "You are not authorized to view this record." }, "@expand:JSON.parse({arguments}.0)"]
            },
            {
                func: "jqUnit.assertEquals",
                args: ["The status code should be correct...", 401, "{anonymousCreate}.nativeResponse.statusCode"]
            }
        ]
    },
    {
        name: "Try to create an invalid record (logged in)...",
        type: "test",
        sequence: [
            {
                func: "{invalidRecordLogin}.send",
                args: [{ username: "existing", password: "password" }]
            },
            {
                event:    "{invalidRecordLogin}.events.onComplete",
                listener: "{invalidRecord}.send",
                args:     [{ sid: "contrib99", source: "~existing"}]
            },
            {
                event:    "{invalidRecord}.events.onComplete",
                listener: "jqUnit.assertLeftHand",
                args:     ["We should have received a validation error.", { isValid: false, statusCode: 400 }, "@expand:JSON.parse({arguments}.0)"]
            },
            {
                func: "jqUnit.assertEquals",
                args: ["The status code should be correct...", 400, "{invalidRecord}.nativeResponse.statusCode"]
            }
        ]
    },
    {
        name: "Update a single record...",
        type: "test",
        sequence: [
            {
                func: "{validRecordLogin}.send",
                args: [{ username: "existing", password: "password" }]
            },
            {
                event:    "{validRecordLogin}.events.onComplete",
                listener: "{validRecordPost}.send",
                args: ["{that}.options.inputs.validNewRecord"]
            },
            {
                event:    "{validRecordPost}.events.onComplete",
                listener: "{validRecordVerify}.send",
                args:     []
            },
            {
                event:    "{validRecordVerify}.events.onComplete",
                listener: "gpii.tests.ul.api.product.updates.verifyRecordUpdated",
                args:     ["{that}.options.inputs.validNewRecord", "@expand:JSON.parse({arguments}.0)"] // expectedRecord, actualRecord
            },
            {
                func: "jqUnit.assertEquals",
                args: ["The status code should be correct...", 200, "{validRecordVerify}.nativeResponse.statusCode"]
            }
        ]
    },
    {
        name: "Add a record with an explicit `updated` value...",
        type: "test",
        sequence: [
            {
                func: "{ancientRecordLogin}.send",
                args: [{ username: "existing", password: "password" }]
            },
            {
                event:    "{ancientRecordLogin}.events.onComplete",
                listener: "{ancientRecordPost}.send",
                args: ["{that}.options.inputs.ancientNewRecord"]
            },
            {
                event:    "{ancientRecordPost}.events.onComplete",
                listener: "{ancientRecordVerify}.send",
                args:     []
            },
            {
                event:    "{ancientRecordVerify}.events.onComplete",
                listener: "jqUnit.assertDeepEq",
                args:     ["The record should have been updated, including the supplied (older) date of last update...", "{that}.options.inputs.ancientNewRecord", "@expand:JSON.parse({arguments}.0)"] // expectedRecord, actualRecord
            },
            {
                func: "jqUnit.assertEquals",
                args: ["The status code should be correct...", 200, "{ancientRecordVerify}.nativeResponse.statusCode"]
            }
        ]
    }
];

fluid.defaults("gpii.tests.ul.api.product.post.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    inputs: {
        ancientNewRecord: {
            description: "A record that is around ten years old, but which we're just hearing about now.",
            manufacturer: { name: "Buffalo Trace"},
            name: "Ancient One",
            sid: "ancient",
            source: "~existing",
            status: "active",
            uid: "1421059432806-826608318",
            updated: "2007-01-03T02:08:35.699Z"
        },
        validNewRecord: {
            description: "sample description",
            manufacturer: { name: "sample manufacturer"},
            name: "sample name",
            sid: "contrib99",
            source: "~existing",
            status: "new",
            uid: "1421059432806-826608318"
        }
    },
    rawModules: [{
        name: "testing POST /api/product/:source/:sid",
        tests: gpii.tests.ul.api.product.post.commonTests
    }],
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        },
        anonymousCreate: {
            type: "gpii.tests.ul.api.product.post.request"
        },
        invalidRecordLogin: {
            type: "gpii.test.ul.api.request.login"
        },
        invalidRecord: {
            type: "gpii.tests.ul.api.product.post.request"
        },
        validRecordLogin: {
            type: "gpii.test.ul.api.request.login"
        },
        validRecordPost: {
            type: "gpii.tests.ul.api.product.post.request"
        },
        validRecordVerify: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint:   "api/product/~existing/contrib99"
            }
        },
        ancientRecordLogin: {
            type: "gpii.test.ul.api.request.login"
        },
        ancientRecordPost: {
            type: "gpii.tests.ul.api.product.post.request"
        },
        ancientRecordVerify: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint:   "api/product/~existing/ancient"
            }
        }
    },
    expected: {
    }
});

fluid.defaults("gpii.tests.ul.api.product.put.caseHolder", {
    gradeNames: ["gpii.tests.ul.api.product.post.caseHolder"],
    rawModules: [{
        name: "testing PUT /api/product/:source/:sid",
        tests: gpii.tests.ul.api.product.post.commonTests
    }],
    distributeOptions: [{
        record: "PUT",
        target: "{that gpii.tests.ul.api.product.post.request}.options.method"
    }]
});

fluid.defaults("gpii.tests.ul.api.product.post.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:    9702,
        couch:  2079
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.product.post.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.product.post.environment");


fluid.defaults("gpii.tests.ul.api.product.put.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api: 9072
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.product.put.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.product.put.environment");
