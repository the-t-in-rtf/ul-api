/* eslint-env node */
// Tests for DELETE /api/product/:source/:sid
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../../");
gpii.ul.api.loadTestingSupport();

// TODO: Reimplement the "DELETE" interface and convert the tests below

//jqUnit.asyncTest("Call the interface with no parameters (not logged in)...", function () {
    //    request.del(deleteTests.productUrl, function (error, response, body) {
    //        jqUnit.assertEquals("The status code should indicate that authorization is required...", 401, response.statusCode);
    //        deleteTests.testUtils.isSaneResponse(jqUnit, error, response, body);
    //        try{
    //            var jsonData = JSON.parse(body);
    //            jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
    //        }
    //        catch(e) {
    //            jqUnit.assertUndefined("There should be no parsing errors:\n" + body, e);
    //        }
    //    });
    //});
    //
    //jqUnit.asyncTest("Call the interface with no parameters (logged in)...", function () {
    //    deleteTests.loginHelper.login(jqUnit, {}, function () {
    //        request.del(deleteTests.productUrl, function (error, response, body) {
    //            jqUnit.start();
    //
    //            jqUnit.assertEquals("The status code should indicate that authorization is required...", 403, response.statusCode);
    //
    //            deleteTests.testUtils.isSaneResponse(jqUnit, error, response, body);
    //            try{
    //                var jsonData = JSON.parse(body);
    //                jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
    //            }
    //            catch(e) {
    //                jqUnit.assertUndefined("There should be no parsing errors:\n" + body, e);
    //            }
    //            finally {
    //                jqUnit.stop();
    //                deleteTests.loginHelper.logout(jqUnit, {});
    //            }
    //        });
    //    });
    //});
    //
    //jqUnit.asyncTest("Call the interface with only one parameter (not logged in)...", function () {
    //    request.del(deleteTests.productUrl  + "/foo", function (error, response, body) {
    //        jqUnit.start();
    //
    //        jqUnit.assertEquals("The status code should indicate that authorization is required...", 401, response.statusCode);
    //
    //        deleteTests.testUtils.isSaneResponse(jqUnit, error, response, body);
    //
    //        try{
    //            var jsonData = JSON.parse(body);
    //            jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
    //        }
    //        catch(e) {
    //            jqUnit.assertUndefined("There should be no parsing errors:\n" + body, e);
    //        }
    //    });
    //});
//

//
//     jqUnit.asyncTest("Delete a record that exists (logged in)...", function () {
//         deleteTests.loginHelper.login(jqUnit, {}, function () {
//             var options = {
//                 "url": deleteTests.productUrl  + "/Handicat/12011",
//                 "jar": deleteTests.loginHelper.jar
//             };
//             request.del(options, function (error, response, body) {
//                 jqUnit.start();
//
//                 deleteTests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                 jqUnit.assertEquals("The status code should indicate that the call was successful...", 200, response.statusCode);
//                 jqUnit.stop();
//
//                 var verifyOptions = {
//                     url: deleteTests.config.couch.url + "_design/ul/_view/products",
//                     qs: { "key": JSON.stringify([ "Handicat", "12011"]) }
//                 };
//                 request.get(verifyOptions, function (error, response, body) {
//                     jqUnit.start();
//                     jqUnit.assertNull("There should be no errors returned when verifying the update:", error);
//                     try {
//                         var data = JSON.parse(body);
//                         jqUnit.assertNotUndefined("There should be record data available", data.rows);
//                         jqUnit.assertEquals("There should be exactly one record", 1, data.rows.length);
//                         if (data.rows && data.rows[0]) {
//                             var record = data.rows[0].value;
//                             jqUnit.assertEquals("The record should have its status set to 'deleted':", "deleted", record.status);
//                         }
//                     }
//                     catch (e) {
//                         jqUnit.assertUndefined("There should be no parsing errors when verifying the update:", e);
//                     }
//
//                     jqUnit.stop();
//                     deleteTests.loginHelper.logout(jqUnit, {});
//                 });
//             });
//         });
//     });
//
//     jqUnit.asyncTest("Try to delete a record that doesn't exist (logged in)...", function () {
//         deleteTests.loginHelper.login(jqUnit, {}, function () {
//             var options = {
//                 "url": deleteTests.productUrl  + "/foo/bar",
//                 "jar": deleteTests.loginHelper.jar
//             };
//             request.del(options, function (error, response, body) {
//                 jqUnit.start();
//
//                 deleteTests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                 jqUnit.assertEquals("The status code should indicate that the record was not found...", 404, response.statusCode);
//
//                 jqUnit.stop();
//                 deleteTests.loginHelper.logout(jqUnit, {});
//             });
//         });
//     });
//
//     jqUnit.asyncTest("Try to delete the same record twice (logged in)...", function () {
//         deleteTests.loginHelper.login(jqUnit, {}, function () {
//             var options = {
//                 "url": deleteTests.productUrl  + "/Hulpmiddelenwijzer/132514",
//                 "jar": deleteTests.loginHelper.jar
//             };
//             request.del(options, function (error, response, body) {
//                 jqUnit.start();
//
//                 deleteTests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                 jqUnit.assertEquals("The status code should indicate that the call was successful...", 200, response.statusCode);
//                 jqUnit.stop();
//
//                 request.del(options, function (error, response, body) {
//                     jqUnit.start();
//                     deleteTests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                     jqUnit.assertEquals("The status code should indicate that the command could not be completed...", 403, response.statusCode);
//                     try {
//                         var data = JSON.parse(body);
//                         jqUnit.assertFalse("The response should not have been 'ok':", data.ok);
//                     }
//                     catch (e) {
//                         jqUnit.assertUndefined("There should be no parsing errors: " + body, e);
//                     }
//
//                     jqUnit.stop();
//                     deleteTests.loginHelper.logout(jqUnit, {});
//                 });
//             });
//         });
//     });
// };


fluid.defaults("gpii.tests.ul.api.product.delete.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    rawModules: [
        {
            name: "testing DELETE /api/product/:source/:sid",
            tests: [
                {
                    name: "Try to delete a record without logging in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousDeleteRequest}.send",
                            args: []
                        },
                        {
                            event:    "{anonymousDeleteRequest}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["We should have received an authentication error message...", { ok: false, statusCode: 401}, "{arguments}.0"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The response status code should be correct...", 401, "{anonymousDeleteRequest}.nativeResponse.statusCode"]
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
        }
    }
});


fluid.defaults("gpii.tests.ul.api.product.delete.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api:    9751,
        couch:  3519,
        lucene: 9151
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.product.delete.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.product.delete.environment");

