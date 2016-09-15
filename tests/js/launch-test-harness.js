/* eslint-env node */
// Launch the test harness as a standalone server to assist in manual QA.
//
"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var gpii  = fluid.registerNamespace("gpii");

require("./lib/test-harness");

// Uncomment this to display the router diagram on startup.
// fluid.require("%gpii-express/tests/js/lib/diagramAllRoutes.js");

gpii.tests.ul.api.harness.withLucene({
    ports: {
        "api":    6914,
        "couch":  6915,
        "lucene": 6916
    },
    listeners: {
        // Uncomment this to display the router diagram on startup.
        // "onFixturesConstructed.diagramRoutes": {
        //     funcName: "console.log",
        //     args: [
        //         "ROUTER DIAGRAM:",
        //         {
        //             expander: {
        //                 funcName: "JSON.stringify",
        //                 args: [
        //                     {
        //                         expander: {
        //                             funcName: "gpii.test.express.diagramAllRoutes",
        //                             args: ["{harness}.express"]
        //                         }
        //                     },
        //                     null,
        //                     2
        //                 ]
        //             }
        //         }
        //     ]
        // },
        "onCreate.constructFixtures": {
            func: "{that}.events.constructFixtures.fire"
        },
        "onDestroy.stopFixtures": {
            func: "{that}.events.stopFixtures.fire"
        }
    }
});
