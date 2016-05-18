// Test fixtures (testEnvironment, testCaseHolder)
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var kettle = fluid.require("%kettle");
kettle.loadTestingSupport();

require("gpii-express");
gpii.express.loadTestingSupport();

require("gpii-test-browser");
gpii.test.browser.loadTestingSupport();

require("./test-harness");

fluid.defaults("gpii.test.ul.api.caseHolder", {
    gradeNames: ["gpii.test.express.caseHolder.base"],
    sequenceStart: [
        { // This sequence point is required because of a QUnit bug - it defers the start of sequence by 13ms "to avoid any current callbacks" in its words
            func: "{testEnvironment}.events.constructFixtures.fire"
        },
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.events.onReady"
        }
    ]
});

fluid.defaults("gpii.test.ul.api.caseHolder.withBrowser", {
    gradeNames: ["gpii.test.browser.caseHolder.withStandardStart"],
    // Manually kill off our fixtures when the tests are finished, and wait for them to die.
    sequenceEnd: [
        {
            func: "{testEnvironment}.harness.stopServer"
        },
        {
            func: "{testEnvironment}.browser.end"
        },
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.events.onAllDone"
        }
    ]
});

fluid.defaults("gpii.test.ul.api.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    ports: {
        api:   7639,
        pouch: 7638
    },
    urls: {
        // We have to duplicate a bit of the work the harness usually does because the harness hasn't been created yet
        // when the options for our request components are expanded.
        api: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port", { port: "{testEnvironment}.options.ports.api" }]
            }
        }
    },
    events: {
        constructFixtures: null,
        onHarnessStarted:  null,
        onHarnessStopped:  null,
        onAllDone: {
            events: {
                onHarnessStopped: "onHarnessStopped"
            }
        },
        onReady: {
            events: {
                onHarnessStarted: "onHarnessStarted"
            }
        }
    },
    components: {
        harness: {
            type: "gpii.ul.api.tests.harness",
            createOnEvent: "constructFixtures",
            options: {
                ports: "{testEnvironment}.options.ports",
                listeners: {
                    "onStarted.notifyEnvironment": {
                        func: "{gpii.test.ul.api.testEnvironment}.events.onHarnessStarted.fire"
                    },
                    "onStopped.notifyEnvironment": {
                        func: "{gpii.test.ul.api.testEnvironment}.events.onHarnessStopped.fire"
                    }
                }
            }
        }
    }
});

fluid.defaults("gpii.test.ul.api.testEnvironment.withBrowser", {
    gradeNames: ["gpii.test.ul.api.testEnvironment", "gpii.test.browser.environment"],
    events: {
        onAllDone: {
            events: {
                onBrowserDone:    "onBrowserDone",
                onHarnessStopped: "onHarnessStopped"
            }
        },
        onReady: {
            events: {
                onHarnessStarted: "onHarnessStarted",
                onBrowserReady:   "onBrowserReady"
            }
        }
    }
});

fluid.defaults("gpii.test.ul.api.request", {
    gradeNames: ["kettle.test.request.httpCookie"],
    port:       "{testEnvironment}.options.ports.api",
    headers: {
        accept: "application/json"
    },
    path: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["%apiUrl/%endpoint", { apiUrl: "{testEnvironment}.options.urls.api", endpoint: "{that}.options.endpoint" }]
        }
    }
});

fluid.defaults("gpii.test.ul.api.request.html", {
    gradeNames: ["gpii.test.ul.api.request"],
    headers: {
        accept: "text/html"
    }
});
