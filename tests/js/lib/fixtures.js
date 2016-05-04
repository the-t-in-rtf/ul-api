// Test fixtures (testEnvironment, testCaseHolder)
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var kettle = require("kettle");
kettle.loadTestingSupport();

require("gpii-express");
gpii.express.loadTestingSupport();

require("gpii-test-browser");
gpii.test.browser.loadTestingSupport();

require("./test-harness");

fluid.defaults("gpii.test.ul.api.testCaseHolder", {
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
    gradeNames: ["gpii.test.browser.environment"],
    ports: {
        api:   7639,
        pouch: 7638
    },
    events: {
        onHarnessStarted: null,
        onHarnessStopped: null,
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
    },
    urls: {
        api: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/api", { port: "{that}.options.ports.api"}]
            }
        },
        pouch:    {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port", { port: "{that}.options.ports.pouch"}]
            }
        },
        db:    {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["%baseUrl/ul", { baseUrl: "{that}.options.urls.pouch"}]
            }
        },
        users:    {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["%baseUrl/users", { baseUrl: "{that}.options.urls.pouch"}]
            }
        }
    },
    components: {
        harness: {
            type: "gpii.ul.api.tests.harness",
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
