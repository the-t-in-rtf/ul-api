/*

    Set up an instance of the UL API so that we can test client-side components with testem.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./tests/js/lib/test-harness");

fluid.registerNamespace("gpii.test.ul.api.testemHarness");

/**
 *
 * Fire up our test harness and call the supplied `callback` when it's ready to work.
 *
 * @param that {Object} The testemHarness component itself.
 * @param callback {Function} The function to call when we are through with our work.
 *
 */
gpii.test.ul.api.testemHarness.createFixtures = function (that, callback) {
    that.events.constructFixtures.fire(that);
    that.events.onReady.addListener(callback);
};

/**
 *
 * Destroy our test fixtures and call the supplied callback.
 *
 * @param that {Object} The testemHarness component itself.
 * @param callback {Function} The function to call when we are through with our work.
 *
 */
gpii.test.ul.api.testemHarness.destroyFixtures = function (that, callback) {
    that.harness.destroy();
    callback();
};

// TODO:  Once this is better tested, make it easier to reuse this approach elsewhere.
fluid.defaults("gpii.test.ul.api.testemHarness", {
    gradeNames: ["fluid.component"],
    testemOptions: {
        // TODO:  Discuss adding tests for other client-side components where keyboard navigation and or browser state is not a concern.
        "test_page": [
            "tests/static/cors-tests.html"
        ],
        // These only work with `testem ci`.  With plain old `testem`, the express instance is immediately destroeyed.
        // TODO: Investigate.
        before_tests: "{that}.createFixtures",
        after_tests:  "{that}.destroyFixtures"
    },
    events: {
        constructFixtures: null,
        onHarnessReady: null,
        // A wrapper to allow other people to change the definition of "ready" to include their own fixtures.
        onReady: {
            events: {
                onHarnessReady: "onHarnessReady"
            }
        }
    },
    invokers: {
        createFixtures: {
            funcName: "gpii.test.ul.api.testemHarness.createFixtures",
            args:     ["{that}", "{arguments}.2"] // config, data, callback
        },
        destroyFixtures: {
            funcName: "gpii.test.ul.api.testemHarness.destroyFixtures",
            args:     ["{that}", "{arguments}.2"] // config, data, callback
        }
    },
    components: {
        harness: {
            type: "gpii.ul.api.tests.harness",
            createOnEvent: "constructFixtures",
            options: {
                ports: {
                    "api":   6194,
                    "pouch": 6195
                },
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{gpii.test.ul.api.testemHarness}.events.onHarnessReady.fire"
                    }
                }
            }
        }
    }
});

var testemHarness = gpii.test.ul.api.testemHarness();
module.exports = testemHarness.options.testemOptions;
