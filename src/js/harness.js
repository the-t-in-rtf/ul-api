// A "harness" to load all parts of the UL API.  By default, this expects to work with a copy of CouchDB running on
// localhost on port 5984, and with a copy of Couchdb-lucene running on port 5985.
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%ul-api");
fluid.require("%gpii-express");
fluid.require("%gpii-express-user");
fluid.require("%gpii-handlebars");

fluid.registerNamespace("gpii.ul.api.harness");

gpii.ul.api.harness.setLogging = function (that) {
    fluid.setLogging(that.options.setLogging);
};

fluid.defaults("gpii.ul.api.harness", {
    gradeNames:   ["fluid.component"],
    templateDirs: ["%ul-api/src/templates", "%gpii-express-user/src/templates", "%gpii-json-schema/src/templates"],
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
        target: "{that gpii.express.handler}.options.timeout"
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
            type: "gpii.express.withJsonQueryParser",
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
                        type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
                        options: {
                            priority: "after:api",
                            path: "/hbs",
                            method: "get",
                            templateDirs: "{gpii.ul.api.harness}.options.templateDirs"
                        }
                    },
                    modules: {
                        type: "gpii.express.router.static",
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
