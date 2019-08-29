/* eslint-env node */
// Tests for DELETE /api/product/:source/:sid
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../../");
gpii.ul.api.loadTestingSupport();

fluid.defaults("gpii.tests.ul.api.product.delete.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    rawModules: [
        {
            name: "testing DELETE /api/product/:source/:sid",
            tests: [
                {
                    name: "Hit the endpoint with no data (anonymously)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousInvalidRequest}.send",
                            args: []
                        },
                        {
                            event:    "{anonymousInvalidRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should have received a validation error message...", { isValid: false, statusCode: 400 }, "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The response status code should be correct...", 400, "{anonymousInvalidRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Delete an existing record (anonymously)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousDeleteRequest}.send",
                            args: []
                        },
                        {
                            event:    "{anonymousDeleteRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should have received an authentication error message...", { isError: true, statusCode: 401}, "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The response status code should be correct...", 401, "{anonymousDeleteRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Hit the endpoint with no data (logged in)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{loginBeforeInvalidRequest}.send",
                            args: [{username: "existing", password: "password"}]
                        },
                        {
                            event:    "{loginBeforeInvalidRequest}.events.onComplete",
                            listener: "{invalidRequest}.send",
                            args:     []
                        },
                        {
                            event:    "{invalidRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should have received a validation error message...", { isValid: false, statusCode: 400 }, "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The response status code should be correct...", 400, "{invalidRequest}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Delete a record that exists but for which we don't have the right permissions...",
                    type: "test",
                    sequence: [
                        {
                            func: "{loginBeforeDeleteWithoutPermission}.send",
                            args: [{username: "existing", password: "password"}]
                        },
                        {
                            event:    "{loginBeforeDeleteWithoutPermission}.events.onComplete",
                            listener: "{deleteWithoutPermission}.send",
                            args:     []
                        },
                        {
                            event:    "{deleteWithoutPermission}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should have received a permission error message...", { isError: true, statusCode: 401}, "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The response status code should be correct...", 401, "{deleteWithoutPermission}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Delete a record that exists and for which we have the right permissions...",
                    type: "test",
                    sequence: [
                        {
                            func: "{loginBeforeDeleteWithPermission}.send",
                            args: [{username: "existing", password: "password"}]
                        },
                        {
                            event:    "{loginBeforeDeleteWithPermission}.events.onComplete",
                            listener: "{deleteWithPermission}.send",
                            args:     []
                        },
                        {
                            event:    "{deleteWithPermission}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should have received a success message...", { statusCode: 200, message: "Record deleted."}, "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The response status code should be correct...", 200, "{deleteWithPermission}.nativeResponse.statusCode"]
                        },
                        {
                            func: "{verifyDeleted}.send"
                        },
                        {
                            event:    "{verifyDeleted}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["The record should be flagged as deleted...", { status: "deleted" }, "@expand:JSON.parse({arguments}.0)"]
                        }
                    ]
                },
                {
                    name: "Hit the endpoint with no data (logged in)...",
                    type: "test",
                    sequence: [
                        {
                            func: "{loginBeforeDeleteMissing}.send",
                            args: [{username: "existing", password: "password"}]
                        },
                        {
                            event:    "{loginBeforeDeleteMissing}.events.onComplete",
                            listener: "{deleteMissing}.send",
                            args:     []
                        },
                        {
                            event:    "{deleteMissing}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should have received a 404 error message...", { isError: true, statusCode: 404}, "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The response status code should be correct...", 404, "{deleteMissing}.nativeResponse.statusCode"]
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
        anonymousDeleteRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                method:   "DELETE",
                endpoint: "api/product/Dlf%20data/0109982"
            }
        },
        anonymousInvalidRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                method:   "DELETE",
                endpoint: "api/product/"
            }
        },
        loginBeforeInvalidRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        invalidRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                method:   "DELETE",
                endpoint: "api/product/"
            }
        },
        loginBeforeDeleteWithoutPermission: {
            type: "gpii.test.ul.api.request.login"
        },
        deleteWithoutPermission: {
            type: "gpii.test.ul.api.request",
            options: {
                method: "DELETE",
                endpoint: "api/product/Dlf%20data/0109982"
            }
        },
        loginBeforeDeleteWithPermission: {
            type: "gpii.test.ul.api.request.login"
        },
        deleteWithPermission: {
            type: "gpii.test.ul.api.request",
            options: {
                method: "DELETE",
                endpoint: "api/product/~existing/contrib1"
            }
        },
        verifyDeleted: {
            type: "gpii.test.ul.api.request",
            options: {
                method:   "GET",
                endpoint: "api/product/~existing/contrib1"
            }
        },
        loginBeforeDeleteMissing: {
            type: "gpii.test.ul.api.request.login"
        },
        deleteMissing: {
            type: "gpii.test.ul.api.request",
            options: {
                method: "DELETE",
                endpoint: "api/product/~existing/contrib999"
            }
        }
    }
});


fluid.defaults("gpii.tests.ul.api.product.delete.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api: 9751
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.product.delete.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.product.delete.environment");
