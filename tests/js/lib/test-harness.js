// Common test harness for all Unified Listing API tests.  This harness can be launched for manual QA using the
// `launch-test-harness.js` file in the parent directory.
//
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var os    = require("os");

fluid.require("%ul-api");
fluid.require("%ul-api/src/js/harness.js");
fluid.require("%gpii-pouchdb");
fluid.require("%gpii-pouchdb-lucene");

require("../lib/provisioner");

fluid.registerNamespace("gpii.tests.ul.api.harness");
gpii.tests.ul.api.harness.stopServer = function (that) {
    gpii.express.stopServer(that.express);
    gpii.express.stopServer(that.pouch);
};

gpii.tests.ul.api.harness.getOriginalsPath = function (that) {
    return gpii.tests.ul.api.harness.getPath(that, "originals");
};

gpii.tests.ul.api.harness.getCachePath = function (that) {
    return gpii.tests.ul.api.harness.getPath(that, "cache");
};

gpii.tests.ul.api.harness.getPath = function (that, dirName) {
    var uniqueDirName = that.id + "-" + dirName;
    return gpii.ul.api.images.file.resolvePath(os.tmpDir(), uniqueDirName);
};

fluid.defaults("gpii.tests.ul.api.harness", {
    gradeNames:   ["gpii.ul.api.harness"],
    originalsDir: "@expand:gpii.tests.ul.api.harness.getOriginalsPath({that})",
    cacheDir:     "@expand:gpii.tests.ul.api.harness.getCachePath({that})",
    setLogging:   true,
    ports: {
        api:    7633,
        couch:  7634
    },
    events: {
        constructFixtures: null,
        pouchStarted:      null,
        pouchStopped:      null,
        provisionerStarted: null,
        onFixturesConstructed: {
            events: {
                apiReady:      "apiReady",
                pouchStarted:  "pouchStarted",
                provisionerStarted: "provisionerStarted"
            }
        },
        onFixturesStopped: {
            events: {
                apiStopped:    "apiStopped",
                pouchStopped:  "pouchStopped"
            }
        },
        stopFixtures: null
    },
    listeners: {
        stopFixtures: {
            funcName: "gpii.tests.ul.api.harness.stopServer",
            args:     ["{that}"]
        }
    },
    components: {
        express: {
            createOnEvent: "constructFixtures"
        },
        pouch: {
            type: "gpii.express",
            createOnEvent: "constructFixtures",
            options: {
                port: "{harness}.options.ports.couch",
                listeners: {
                    onStarted: {
                        func: "{harness}.events.pouchStarted.fire"
                    },
                    onStopped: {
                        func: "{harness}.events.pouchStopped.fire"
                    }
                },
                components: {
                    pouch: {
                        type: "gpii.pouch.express",
                        options: {
                            path: "/",
                            // The following whisks away the inherited options that would disable the leaky "changes"
                            // endpoint. Turns out couchdb-lucene searches will fail with overly vague "not found"
                            // errors if that endpoint is not present.
                            distributeOptions: {
                                source:       "{that}.options.expressPouchConfig.overrideMode",
                                target:       "{that}.options.devNull",
                                removeSource: true
                            },
                            databases: {
                                users: { data: "%ul-api/tests/data/users.json" },
                                ul:    { data: ["%ul-api/tests/data/pilot.json", "%ul-api/tests/data/deleted.json", "%ul-api/tests/data/updates.json", "%ul-api/tests/data/views.json", "%ul-api/tests/data/whetstone.json"] }
                            }
                        }
                    }
                }
            }
        },
        provisioner: {
            type: "gpii.tests.ul.api.provisioner",
            createOnEvent: "constructFixtures",
            options: {
                originalsDir: "{harness}.options.originalsDir",
                cacheDir:     "{harness}.options.cacheDir",
                listeners: {
                    "onProvisioned.notifyParent": {
                        func: "{harness}.events.provisionerStarted.fire"
                    }
                }
            }
        }
    }
});

fluid.registerNamespace("gpii.tests.ul.api.harness.withLucene");
gpii.tests.ul.api.harness.stopServer.withLucene = function (that) {
    gpii.tests.ul.api.harness.stopServer(that);
    that.lucene.events.onReadyForShutdown.fire();
};

// A test harness that includes search integration (loads more slowly).
fluid.defaults("gpii.tests.ul.api.harness.withLucene", {
    gradeNames:   ["gpii.tests.ul.api.harness", "gpii.ul.api.harness.withLucene"],
    ports: {
        lucene: 7635
    },
    events: {
        luceneStarted: null,
        luceneStopped: null,
        onFixturesConstructed: {
            events: {
                apiReady:      "apiReady",
                luceneStarted: "luceneStarted",
                pouchStarted:  "pouchStarted"
            }
        },
        onFixturesStopped: {
            events: {
                apiStopped:    "apiStopped",
                luceneStopped: "luceneStopped",
                pouchStopped:  "pouchStopped"
            }
        }
    },
    listeners: {
        stopFixtures: {
            funcName: "gpii.tests.ul.api.harness.stopServer.withLucene",
            args:     ["{that}"]
        }
    },
    components: {
        lucene: {
            type: "gpii.pouch.lucene",
            createOnEvent: "constructFixtures",
            options: {
                port: "{gpii.ul.api.harness.withLucene}.options.ports.lucene",
                dbUrl: "{gpii.ul.api.harness.withLucene}.options.urls.couch",
                processTimeout: 4000,
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{gpii.ul.api.harness.withLucene}.events.luceneStarted.fire"
                    },
                    "onShutdownComplete.notifyParent": {
                        func: "{gpii.ul.api.harness.withLucene}.events.luceneStopped.fire"
                    }
                }
            }
        }
    }
});
