// Test fixtures (testEnvironment, testCaseHolder)
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var kettle = require("kettle");
kettle.loadTestingSupport();

require("gpii-express");
gpii.express.loadTestingSupport();

require("gpii-test-browser");
gpii.tests.browser.loadTestingSupport();

require("./test-harness");

fluid.defaults("gpii.ul.api.tests.testCaseHolder", {
    gradeNames: ["gpii.tests.browser.caseHolder.withStandardStart"],
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

fluid.defaults("gpii.ul.api.tests.testEnvironment", {
    gradeNames: ["gpii.tests.browser.environment"],
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
                        func: "{gpii.ul.api.tests.testEnvironment}.events.onHarnessStarted.fire"
                    },
                    "onStopped.notifyEnvironment": {
                        func: "{gpii.ul.api.tests.testEnvironment}.events.onHarnessStopped.fire"
                    }
                }
            }
        }
    }
});

fluid.defaults("gpii.ul.api.tests.request", {
    gradeNames: ["kettle.test.request.httpCookie"],
    port:       "{testEnvironment}.options.ports.api",
    path: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["%apiUrl/%endpoint", { apiUrl: "{testEnvironment}.options.urls.api", endpoint: "{that}.options.endpoint" }]
        }
    }
});

fluid.defaults("gpii.ul.api.tests.request.json", {
    gradeNames: ["gpii.ul.api.tests.request"],
    headers: {
        accept: "application/json"
    }
});

fluid.defaults("gpii.ul.api.tests.request.html", {
    gradeNames: ["gpii.ul.api.tests.request"],
    headers: {
        accept: "application/json"
    }
});
