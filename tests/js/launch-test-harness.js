// Launch the test harness as a standalone server to assist in manual QA.
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("./lib/test-harness");

// Uncomment this to display the router diagram on startup.
// fluid.require("%gpii-express/tests/js/lib/diagramAllRoutes.js");

gpii.ul.api.tests.harness({
    ports: {
        "api":   6914,
        "pouch": 6915
    }
    // Uncomment this to display the router diagram on startup.
    // listeners: {
    //     "onStarted.diagramRoutes": {
    //         funcName: "console.log",
    //         args: [
    //             "ROUTER DIAGRAM:",
    //             {
    //                 expander: {
    //                     funcName: "JSON.stringify",
    //                     args: [
    //                         {
    //                             expander: {
    //                                 funcName: "gpii.test.express.diagramAllRoutes",
    //                                 args: ["{harness}.express"]
    //                             }
    //                         },
    //                         null,
    //                         2
    //                     ]
    //                 }
    //             }
    //         ]
    //     }
    // }
});
