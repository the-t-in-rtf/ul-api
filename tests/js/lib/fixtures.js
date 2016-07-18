/* eslint-env node */
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
    gradeNames: ["gpii.test.express.caseHolder"],
    // kill off our fixtures when the tests are finished, and wait for them to die.
    sequenceEnd: [
        {
            func: "{testEnvironment}.stopFixtures"
        },
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.events.onFixturesStopped"
        }
    ]
});

fluid.registerNamespace("gpii.test.ul.api.testEnvironment");

gpii.test.ul.api.testEnvironment.stopFixtures = function (that) {
    that.harness.stopServer();
};

fluid.defaults("gpii.test.ul.api.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    hangWait: 6000,
    ports: {
        api:    7639,
        pouch:  7638,
        lucene: 7637
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
        onFixturesStopped: {
            events: {
                onHarnessStopped: "onHarnessStopped"
            }
        },
        onFixturesConstructed: {
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
                        func: "{testEnvironment}.events.onHarnessStarted.fire"
                    },
                    "onStopped.notifyEnvironment": {
                        func: "{testEnvironment}.events.onHarnessStopped.fire"
                    }
                }
            }
        }
    },
    invokers: {
        stopFixtures: {
            funcName: "gpii.test.ul.api.testEnvironment.stopFixtures",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.test.ul.api.caseHolder.withBrowser", {
    gradeNames: ["gpii.test.browser.caseHolder.withStandardStart", "gpii.test.ul.api.caseHolder.withStandardFinish"]
});

fluid.registerNamespace("gpii.test.ul.api.testEnvironment.withBrowser");
gpii.test.ul.api.testEnvironment.withBrowser.stopFixtures = function (that) {
    that.harness.stopServer();
    that.browser.end();
};


fluid.defaults("gpii.test.ul.api.testEnvironment.withBrowser", {
    gradeNames: ["gpii.test.ul.api.testEnvironment", "gpii.test.browser.environment"],
    events: {
        onFixturesStopped: {
            events: {
                onBrowserDone:    "onBrowserDone",
                onHarnessStopped: "onHarnessStopped"
            }
        },
        onFixturesConstructed: {
            events: {
                onHarnessStarted: "onHarnessStarted",
                onBrowserReady:   "onBrowserReady"
            }
        }
    },
    components: {
        browser: {
            options: {
                events: {
                    stopFixtures: "{testEnvironment}.events.stopFixtures"
                }
            }
        }
    },
    invokers: {
        stopFixtures: {
            funcName: "gpii.test.ul.api.testEnvironment.withBrowser.stopFixtures",
            args:     ["{that}"]
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

