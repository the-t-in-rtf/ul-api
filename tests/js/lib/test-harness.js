// Common test harness for all Unified Listing API tests.  This harness can be launched for manual QA using the
// `launch-test-harness.js` file in the parent directory.
//
"use strict";
var fluid = require("infusion");

require("../../../");

require("gpii-express");
require("gpii-pouchdb");
require("gpii-express-user");
require("gpii-handlebars");


fluid.defaults("gpii.ul.api.tests.harness", {
    gradeNames: ["fluid.modelComponent"],
    ports: {
        api:   7633,
        pouch: 7634
    },
    templateDirs: ["%ul-api/src/templates", "%gpii-express-user/src/templates", "%gpii-json-schema/src/templates"],
    schemaDirs:   ["%ul-api/src/schemas", "%gpii-express-user/src/schemas"],
    urls: {
        api:     {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/api", { port: "{harness}.options.ports.api"}]
            }
        },
        pouch:    {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port", { port: "{harness}.options.ports.pouch"}]
            }
        },
        db:    {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["%baseUrl/ul", { baseUrl: "{harness}.options.urls.pouch"}]
            }
        },
        users:    {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["%baseUrl/users", { baseUrl: "{harness}.options.urls.pouch"}]
            }
        }
    },
    events: {
        apiStarted:   null,
        pouchStarted: null,
        onStarted: {
            events: {
                apiStarted:   "apiStarted",
                pouchStarted: "pouchStarted"
            }
        }
    },
    components: {
        express: {
            type: "gpii.express",
            options: {
                config: {
                    express: {
                        port :   "{harness}.options.ports.api",
                        baseUrl: "{harness}.options.urls.api",
                        views:   "{gpii.ul.api.tests.harness}.options.templateDirs",
                        session: { secret: "Printer, printer take a hint-ter."}
                    }
                },
                listeners: {
                    onStarted: "{harness}.events.apiStarted.fire"
                },
                components: {
                    json: {
                        type: "gpii.express.middleware.bodyparser.json"
                    },
                    urlencoded: {
                        type: "gpii.express.middleware.bodyparser.urlencoded"
                    },
                    cookieparser: {
                        type: "gpii.express.middleware.cookieparser"
                    },
                    session: {
                        type: "gpii.express.middleware.session"
                    },
                    handlebars: {
                        type: "gpii.express.hb",
                        options: {
                            templateDirs: "{gpii.ul.api.tests.harness}.options.templateDirs"
                        }
                    },
                    // Client-side Handlebars template bundles
                    inline: {
                        type: "gpii.express.hb.inline",
                        options: {
                            path: "/hbs",
                            templateDirs: "{gpii.ul.api.tests.harness}.options.templateDirs"
                        }
                    },
                    // NPM dependencies
                    nm: {
                        type: "gpii.express.router.static",
                        options: {
                            path: "/nm",
                            content: "%ul-api/node_modules"
                        }

                    },
                    // Our own source
                    src: {
                        type: "gpii.express.router.static",
                        options: {
                            path:    "/src",
                            content: "%ul-api/src"
                        }
                    },
                    // Bower Components
                    bc: {
                        type: "gpii.express.router.static",
                        options: {
                            path: "/bc",
                            content: "%ul-api/bower_components"
                        }

                    },
                    // JSON Schemas, available individually
                    schemas: {
                        type: "gpii.express.router.static",
                        options: {
                            path:    "/schemas",
                            content: "{gpii.ul.api.tests.harness}.options.schemaDirs"
                        }
                    },
                    // Bundled JSON Schemas for client-side validation
                    allSchemas: {
                        type: "gpii.schema.inline.router",
                        options: {
                            path:       "/allSchemas",
                            schemaDirs: "{gpii.ul.api.tests.harness}.options.schemaDirs"
                        }
                    },
                    api: {
                        type: "gpii.ul.api",
                        options: {
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
                config: {
                    express: {
                        "port" : "{harness}.options.ports.pouch",
                        baseUrl: "{harness}.options.urls.pouch"
                    },
                    app: {
                        name: "Pouch Test Server",
                        url:  "{harness}.options.urls.pouch"
                    }
                },
                listeners: {
                    onStarted: "{harness}.events.pouchStarted.fire"
                },
                components: {
                    pouch: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
                            databases: {
                                users: { data: "%ul-api/tests/data/users.json" },
                                ul:    { data: "%ul-api/tests/data/ul.json" }
                            }
                        }
                    }
                }
            }
        }
    }
});