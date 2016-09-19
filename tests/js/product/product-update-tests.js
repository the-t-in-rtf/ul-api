/* eslint-env node */
// tests for POST /api/product
"use strict";
var fluid       = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../../");
gpii.ul.api.loadTestingSupport();

fluid.defaults("gpii.tests.ul.api.product.post.request", {
    gradeNames: ["gpii.test.ul.api.request"],
    method:     "POST",
    endpoint:   "api/product"
});

fluid.defaults("gpii.tests.ul.api.product.post.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    inputs: {
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
    rawModules: [
        {
            name: "testing POST /api/product/:source/:sid",
            tests: [
                {
                    name: "Try to create a record without logging in...",
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
                            args:     ["We should have received a validation error.", { isError: true, statusCode: 400, message: "The information you provided is incomplete or incorrect.  Please check the following:" }, "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should be correct...", 400, "{invalidRecord}.nativeResponse.statusCode"]
                        }
                    ]
                }
            ]
        }
    ],
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
        }
    },
    expected: {
    }
});

fluid.defaults("gpii.tests.ul.api.product.put.caseHolder", {
    gradeNames: ["gpii.tests.ul.api.product.post.caseHolder"],
    distributeOptions: [
        {
            record: "testing PUT /api/product/:source/:sid",
            target: "{that}.options.rawModules.0.name"
        },
        {
            record: "PUT",
            target: "{that gpii.tests.ul.api.product.post.request}.options.method"
        }
    ]
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
        api:    9072,
        couch:  2709
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.product.put.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.product.put.environment");
