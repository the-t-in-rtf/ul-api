// A "harness" to load all parts of the UL API.  By default, this expects to work with a copy of CouchDB running on
// localhost on port 5984, and with a copy of Couchdb-lucene running on port 5985.
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%ul-api");
fluid.require("%fluid-express");
fluid.require("%fluid-express-user");
fluid.require("%fluid-handlebars");

fluid.registerNamespace("gpii.ul.api.harness");

gpii.ul.api.harness.setLogging = function (that) {
    fluid.setLogging(that.options.setLogging);
};

fluid.defaults("gpii.ul.api.harness", {
    gradeNames:   ["fluid.component"],
    templateDirs: {
        api: {
            path: "%ul-api/src/templates",
            priority: "before:user"
        },
        user: {
            path: "%fluid-express-user/src/templates",
            priority: "before:validation"
        },
        validation: {
            priority: "last",
            path: "%fluid-json-schema/src/templates"
        }
    },
    sessionKey:   "_ul_user",
    originalsDir: "/opt/ul-files/originalsDir",
    cacheDir:     "/opt/ul-files/cacheDir",
    setLogging:   true,
    hosts: {
        api:    "localhost",
        couch:  "localhost",
        lucene: "localhost"
    },
    ports: {
        api:    3367,
        couch:  5984,
        lucene: 5985
    },
    distributeOptions: {
        record: 120000,
        target: "{that fluid.express.handler}.options.timeout"
    },
    urls: {
        api: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://%host:%port/", { host: "{that}.options.hosts.api", port: "{that}.options.ports.api" }]
            }
        },
        couch: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://%host:%port/", { host: "{that}.options.hosts.couch", port: "{that}.options.ports.couch" }]
            }
        },
        imageDb: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://%host:%port/%dbName", { host: "{that}.options.hosts.couch", port: "{that}.options.ports.couch", dbName: "{that}.options.dbNames.images"}]
            }
        },
        lucene: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://%host:%port/local/%dbName/_design/lucene/by_content", { host: "{that}.options.hosts.lucene", port: "{that}.options.ports.lucene", dbName: "{that}.options.dbNames.ul"}]
            }
        },
        ulDb: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://%host:%port/%dbName", { host: "{that}.options.hosts.couch", port: "{that}.options.ports.couch", dbName: "{that}.options.dbNames.ul"}]
            }
        },
        usersDb: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://%host:%port/%dbName", { host: "{that}.options.hosts.couch", port: "{that}.options.ports.couch", dbName: "{that}.options.dbNames.users"}]
            }
        }
    },
    dbNames: {
        images: "images",
        ul:    "ul",
        users: "users"
    },
    listeners: {
        "onCreate.setLogging": {
            funcName: "gpii.ul.api.harness.setLogging",
            args:     ["{that}"]
        }
    },
    components: {
        express: {
            type: "fluid.express.withJsonQueryParser",
            options: {
                port :        "{gpii.ul.api.harness}.options.ports.api",
                templateDirs: "{gpii.ul.api.harness}.options.templateDirs",
                components: {
                    api: {
                        type: "gpii.ul.api",
                        options: {
                            priority:     "after:jsonQueryParser",
                            templateDirs: "{gpii.ul.api.harness}.options.templateDirs",
                            originalsDir: "{gpii.ul.api.harness}.options.originalsDir",
                            cacheDir:     "{gpii.ul.api.harness}.options.cacheDir",
                            urls:         "{gpii.ul.api.harness}.options.urls"
                        }
                    },
                    inline: {
                        type: "fluid.handlebars.inlineTemplateBundlingMiddleware",
                        options: {
                            priority: "after:api",
                            path: "/templates",
                            method: "get",
                            templateDirs: "{gpii.ul.api.harness}.options.templateDirs"
                        }
                    },
                    modules: {
                        type: "fluid.express.router.static",
                        options: {
                            priority: "after:api",
                            path: "/modules",
                            content: "%ul-api/node_modules"
                        }
                    }
                }
            }
        }
    }
});
