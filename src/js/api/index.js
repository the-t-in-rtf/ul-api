/*

    The API that powers the Unified Listing.  See the API docs for details:

    https://github.com/GPII/ul-api/blob/master/docs/apidocs.md

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("gpii-express");
require("gpii-express-user");

require("./docs");
require("./product");
//require("./products");
require("./search");
require("./sources");
//require("./updates");
require("./404");

fluid.defaults("gpii.ul.api", {
    gradeNames:   ["gpii.express.router", "gpii.express.user.withRequiredMiddleware"],
    path:         "/api",
    templateDirs: ["%gpii-ul-api/src/templates", "%gpii-express-user/src/templates", "%gpii-json-schema/src/templates"],
    schemaDirs:   ["%gpii-ul-api/src/schemas", "%gpii-express-user/src/schemas"],
    sessionKey:   "_ul_user",
    events: {
        productEndpointReady: null,
        onReady: {
            events: {
                productEndpointReady: "productEndpointReady"
            }
        }
    },
    rules: {
        contextToExpose: {
            "layout": "layout", // This is required to support custom layouts
            "model": {
                "user":   "req.session._gpii_user",
                "record": "product"
            },
            "req":  {
                "query":  "req.query",
                "params": "req.params"
            }
        }
    },
    distributeOptions: [
        {
            source: "{that}.options.rules.contextToExpose",
            target: "{that gpii.express.singleTemplateMiddleware}.options.rules.contextToExpose"
        },
        {
            source: "{that}.options.rules.contextToExpose",
            target: "{that gpii.ul.api.htmlMessageHandler}.options.rules.contextToExpose"
        },
        {
            source: "{that}.options.sessionKey",
            target: "{that gpii.express.handler}.options.sessionKey"
        }
    ],
    components: {
        // Our public API is available for integrators to make calls against remotely.  These CORS headers make that
        // possible: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        corsHeaders: {
            type: "gpii.express.middleware.headerSetter",
            options: {
                priority: "first",
                headers: {
                    cors: {
                        fieldName: "Access-Control-Allow-Origin",
                        template:  "*",
                        dataRules: {}
                    }
                }
            }
        },
        session: {
            type: "gpii.express.middleware.session",
            options: {
                priority: "after:corsHeaders",
                sessionOptions: {
                    secret: "Printer, printer take a hint-ter."
                }
            }
        },
        product: {
            type: "gpii.ul.api.product",
            options: {
                priority: "after:session",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api}.events.productEndpointReady.fire"
                    }
                }
            }
        },
        //products: {
        //    type: "gpii.ul.api.products",
        // options: {
        //     priority: "after:docs"
        // }
        //},
        search: {
            type: "gpii.ul.api.search",
            options: {
                priority: "after:corsHeaders"
            }
        },
        suggest: {
            type: "gpii.ul.api.suggest",
            options: {
                priority: "after:corsHeaders"
            }
        },
        //sources: {
        //    type: "gpii.ul.api.sources.router",
        //    options: {
        //        path: "/sources",
        //     priority: "after:docs"
        //    }
        //},
        //updates: {
        //    type: "gpii.ul.api.updates.router",
        //    options: {
        //        path: "/updates",
        //     priority: "after:docs",
        //        couch: "{gpii.express}.options.config.couch"
        //    }
        //},
        user: {
            type: "gpii.express.user.api",
            options: {
                templateDirs: "{gpii.ul.api}.options.templateDirs",
                // TODO:  Update this
                app:       "{gpii.express}.options.config.app",
                couch: {
                    userDbName: "users", // TODO:  Confirm whether this is used in the package
                    userDbUrl: "{gpii.ul.api}.options.urls.usersDb"
                },
                components: {
                    // Replace the user API's session middleware so that ours will be used instead.
                    session: {
                        type: "fluid.component"
                    }
                }
            }
        },
        // HTML error-handling middleware (for browsers making non-AJAX requests)
        htmlErrorHandler: {
            type: "gpii.handlebars.errorRenderingMiddleware",
            options: {
                templateKey: "pages/error",
                priority:    "after:user"
            }
        },
        // JSON  error-handling middleware (JSON)
        jsonErrorHandler: {
            type: "gpii.express.middleware.error",
            options: {
                priority: "after:htmlErrorHandler",
                errorOutputRules: {
                    "isError":     "error.isError",
                    "message":     "error.message",
                    "fieldErrors": "error.fieldErrors"
                }
            }
        },
        docs: {
            type: "gpii.ul.api.docs",
            options: {
                priority: "after:jsonErrorHandler"
            }
        },
        jsonErrors: {
            type: "gpii.express.middleware.error",
            options: {
                priority: "after:docs",
                rules: {
                    errorOutputRules: {
                        "isError":     "error.isError",
                        "message":     "error.message",
                        "fieldErrors": "error.fieldErrors"
                    }
                }
            }
        },
        // TODO:  Test with a bogus path versus /
        404: {
            type:     "gpii.ul.api.404",
            options: {
                // TODO:  investigate why "last" does not work properly here.
                priority: "after:docs"
            }
        }
    }
});
