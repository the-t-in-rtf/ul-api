// Common test harness for all Unified Listing API tests.  This harness can be launched for manual QA using the
// `launch-test-harness.js` file in the parent directory.
//
/* eslint-env node */
"use strict";
var fluid = require("infusion");

var gpii  = fluid.registerNamespace("gpii");

require("../../../");

fluid.require("%gpii-express");
fluid.require("%gpii-pouchdb");
fluid.require("%gpii-pouchdb-lucene");
fluid.require("%gpii-express-user");
fluid.require("%gpii-handlebars");

fluid.registerNamespace("gpii.tests.ul.api.harness");
gpii.tests.ul.api.harness.stopServer = function (that) {
    gpii.express.stopServer(that.express);
    gpii.express.stopServer(that.pouch);
};

fluid.defaults("gpii.tests.ul.api.harness", {
    gradeNames:   ["fluid.component"],
    templateDirs: ["%ul-api/src/templates", "%gpii-express-user/src/templates", "%gpii-json-schema/src/templates"],
    schemaDirs:   ["%ul-api/src/schemas", "%gpii-express-user/src/schemas"],
    ports: {
        api:    7633,
        couch:  7634
    },
    urls: {
        couch: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/", { port: "{that}.options.ports.couch" }]
            }
        },
        ulDb: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/%dbName", { port: "{that}.options.ports.couch", dbName: "{that}.options.dbNames.ul"}]
            }
        },
        usersDb: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/%dbName", { port: "{that}.options.ports.couch", dbName: "{that}.options.dbNames.users"}]
            }
        }
    },
    dbNames: {
        ul:    "ul",
        users: "users"
    },
    events: {
        apiReady:          null,
        apiStopped:        null,
        constructFixtures: null,
        pouchStarted:      null,
        pouchStopped:      null,
        onFixturesConstructed: {
            events: {
                apiReady:      "apiReady",
                pouchStarted:  "pouchStarted"
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
            type: "gpii.express.withJsonQueryParser",
            createOnEvent: "constructFixtures",
            options: {
                // gradeNames: ["gpii.express.user.withRequiredMiddleware"],
                port :   "{harness}.options.ports.api",
                templateDirs: "{harness}.options.templateDirs",
                events: {
                    apiReady: null,
                    onReady: {
                        events: {
                            apiReady: "apiReady",
                            onStarted: "onStarted"
                        }
                    }
                },
                listeners: {
                    onReady:   {
                        func: "{harness}.events.apiReady.fire"
                    },
                    onStopped: {
                        func: "{harness}.events.apiStopped.fire"
                    }
                },
                components: {
                    api: {
                        type: "gpii.ul.api",
                        options: {
                            priority: "after:jsonQueryParser",
                            urls:     "{harness}.options.urls",
                            listeners: {
                                "onReady.notifyParent": {
                                    func: "{harness}.events.apiReady.fire"
                                }
                            }
                        }
                    }
                }
            }
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
                            databases: {
                                users: { data: "%ul-api/tests/data/users.json" },
                                ul:    { data: ["%ul-api/tests/data/pilot.json", "%ul-api/tests/data/deleted.json", "%ul-api/tests/data/updates.json", "%ul-api/tests/data/views.json", "%ul-api/tests/data/whetstone.json"] }
                            }
                        }
                    }
                }
            }
        }
    }
});

// A harness that includes search integration (loads more slowly).
fluid.registerNamespace("gpii.tests.ul.api.harness.withLucene");
gpii.tests.ul.api.harness.stopServer.withLucene = function (that) {
    gpii.tests.ul.api.harness.stopServer(that);
    that.lucene.events.onReadyForShutdown.fire();
};

fluid.defaults("gpii.tests.ul.api.harness.withLucene", {
    gradeNames:   ["gpii.tests.ul.api.harness"],
    ports: {
        lucene: 7635
    },
    urls: {
        lucene: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/local/%dbName/_design/lucene/by_content", { port: "{that}.options.ports.lucene", dbName: "{that}.options.dbNames.ul"}]
            }
        }
    },
    events: {
        luceneStarted:     null,
        luceneStopped:     null,
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
                port: "{harness}.options.ports.lucene",
                dbUrl: "{harness}.options.urls.couch",
                processTimeout: 4000,
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{harness}.events.luceneStarted.fire"
                    },
                    "onShutdownComplete.notifyParent": {
                        func: "{harness}.events.luceneStopped.fire"
                    }
                }
            }
        }
    }
});
