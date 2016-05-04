// Common test harness for all Unified Listing API tests.  This harness can be launched for manual QA using the
// `launch-test-harness.js` file in the parent directory.
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../../");

require("gpii-express");
require("gpii-pouchdb");
require("gpii-express-user");
require("gpii-handlebars");

fluid.registerNamespace("gpii.ul.api.tests.harness");
gpii.ul.api.tests.harness.stopServer = function (that) {
    that.express.destroy();
    that.pouch.destroy();
};

fluid.defaults("gpii.ul.api.tests.harness", {
    gradeNames:   ["fluid.modelComponent"],
    templateDirs: ["%gpii-ul-api/src/templates", "%gpii-express-user/src/templates", "%gpii-json-schema/src/templates"],
    schemaDirs:   ["%gpii-ul-api/src/schemas", "%gpii-express-user/src/schemas"],
    ports: {
        api:   7633,
        pouch: 7634
    },
    urls: {
        api: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port", { port: "{that}.options.ports.api"}]
            }
        },
        pouch: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port", { port: "{that}.options.ports.pouch"}]
            }
        }
    },
    events: {
        apiStarted:   null,
        apiStopped:   null,
        pouchStarted: null,
        pouchStopped: null,
        onStarted: {
            events: {
                apiStarted:   "apiStarted",
                pouchStarted: "pouchStarted"
            }
        },
        onStopped: {
            events: {
                apiStopped:   "apiStopped",
                pouchStopped: "pouchStopped"
            }
        }
    },
    invokers: {
        // Pass through requests to "stop" the component to the underlying components
        stopServer: {
            funcName: "gpii.ul.api.tests.harness.stopServer",
            args:     ["{that}"]
        }
    },
    components: {
        express: {
            type: "gpii.express",
            options: {
                gradeNames: ["gpii.express.user.withRequiredMiddleware"],
                port :   "{harness}.options.ports.api",
                templateDirs: "{harness}.options.templateDirs",
                listeners: {
                    onStarted: "{harness}.events.apiStarted.fire",
                    onStopped: "{harness}.events.apiStopped.fire"
                },
                components: {
                    // Client-side Handlebars template bundles
                    inline: {
                        type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
                        options: {
                            priority: "after:session",
                            path: "/hbs",
                            templateDirs: "{harness}.options.templateDirs"
                        }
                    },
                    // NPM dependencies
                    nm: {
                        type: "gpii.express.router.static",
                        options: {
                            priority: "after:session",
                            path: "/nm",
                            content: "%gpii-ul-api/node_modules"
                        }

                    },
                    // Our own source
                    src: {
                        type: "gpii.express.router.static",
                        options: {
                            priority: "after:session",
                            path:    "/src",
                            content: "%gpii-ul-api/src"
                        }
                    },
                    // Bower Components
                    bc: {
                        type: "gpii.express.router.static",
                        options: {
                            priority: "after:session",
                            path: "/bc",
                            content: "%gpii-ul-api/bower_components"
                        }

                    },
                    // JSON Schemas, available individually
                    schemas: {
                        type: "gpii.express.router.static",
                        options: {
                            priority: "after:session",
                            path:    "/schemas",
                            content: "{harness}.options.schemaDirs"
                        }
                    },
                    // Bundled JSON Schemas for client-side validation
                    allSchemas: {
                        type: "gpii.schema.inlineMiddleware",
                        options: {
                            priority: "after:session",
                            path:       "/allSchemas",
                            schemaDirs: "{harness}.options.schemaDirs"
                        }
                    },
                    api: {
                        type: "gpii.ul.api",
                        options: {
                            // TODO:  investigate why "last" does not work properly here.
                            priority: "after:allSchemas",
                            couch: {
                                urls: {
                                    base: "{harness}.options.urls.pouch"
                                }
                            }
                        }
                    }
                }
            }
        },
        pouch: {
            type: "gpii.express",
            options: {
                port: "{harness}.options.ports.pouch",
                listeners: {
                    onStarted: "{harness}.events.pouchStarted.fire",
                    onStopped: "{harness}.events.pouchStopped.fire"
                },
                components: {
                    pouch: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
                            databases: {
                                users: { data: "%gpii-ul-api/tests/data/users.json" },
                                ul:    { data: "%gpii-ul-api/tests/data/ul.json" }
                            }
                        }
                    }
                }
            }
        }
    }
});