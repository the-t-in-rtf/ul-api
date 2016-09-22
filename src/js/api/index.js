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
require("./products");
require("./search");
require("./sources");
require("./updates");
require("./404");

fluid.defaults("gpii.ul.api", {
    gradeNames:   ["gpii.express.router"],
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
                "user":    "req.session._ul_user",
                "product": "product"
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
        json: {
            type: "gpii.express.middleware.bodyparser.json",
            options: {
                priority: "first"
            }
        },
        urlencoded: {
            type: "gpii.express.middleware.bodyparser.urlencoded",
            options: {
                priority: "after:json"
            }
        },
        handlebars: {
            type: "gpii.express.hb",
            options: {
                priority: "after:urlencoded",
                templateDirs: "{gpii.ul.api}.options.templateDirs",
                components: {
                    initBlock: {
                        options: {
                            contextToOptionsRules: {
                                req:     "req",
                                product: "product"
                            }
                        }
                    }
                }
            }
        },
        cookieparser: {
            type:     "gpii.express.middleware.cookieparser",
            options: {
                priority: "first"
            }
        },
        session: {
            type: "gpii.express.middleware.session",
            options: {
                priority: "after:cookieparser",
                sessionOptions: {
                    secret: "Printer, printer take a hint-ter."
                }
            }
        },
        user: {
            type: "gpii.express.user.api",
            options: {
                priority: "after:session",
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
        product: {
            type: "gpii.ul.api.product",
            options: {
                priority: "after:user",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api}.events.productEndpointReady.fire"
                    }
                }
            }
        },
        products: {
            type: "gpii.ul.api.products",
            options: {
                priority: "after:product"
            }
        },
        search: {
            type: "gpii.ul.api.search",
            options: {
                priority: "after:products"
            }
        },
        suggest: {
            type: "gpii.ul.api.suggest",
            options: {
                priority: "after:search"
            }
        },
        sources: {
            type: "gpii.ul.api.sources",
            options: {
                priority: "after:suggest"
            }
        },
        updates: {
            type: "gpii.ul.api.updates",
            options: {
                priority: "after:sources"
            }
        },
        // TODO: Test that this returns reasonable responses for common errors (404s, permission failures).
        // HTML error-handling middleware (for browsers making non-AJAX requests)
        // htmlErrorHandler: {
        //     type:     "gpii.handlebars.errorRenderingMiddleware",
        //     options: {
        //         priority: "after:sources",
        //         templateKey: "pages/error"
        //     }
        // },
        // TODO: Remove this once everything is confirmed working
        // JSON  error-handling middleware (JSON)
        // jsonErrorHandler: {
        //     type:     "gpii.express.middleware.error",
        //     options: {
        //         priority: "after:htmlErrorHandler",
        //         errorOutputRules: {
        //             "isError":     "error.isError",
        //             "message":     "error.message",
        //             "fieldErrors": "error.fieldErrors"
        //         }
        //     }
        // },
        docs: {
            type: "gpii.ul.api.docs",
            options: {
                priority: "after:jsonErrorHandler"
            }
        },
        // // TODO: Separate handler to pick up errors in the docs?  Try removing one of these.
        jsonErrors: {
            type: "gpii.express.middleware.error",
            priority: "after:docs",
            options: {
                rules: {
                    errorOutputRules: {
                        "isError":     "error.isError",
                        "message":     "error.message",
                        "fieldErrors": "error.fieldErrors"
                    }
                }
            }
        },
        // TODO: Get this working again or remove with cause.
        // Handling for bad URLs.  TODO:  Test this to confirm that it displays a meaningful message in both HTML and JSON
        // TODO:  Test with a bogus path versus /
        // 404: {
        //     type:     "gpii.ul.api.404",
        //     priority: "after:jsonErrors"
        // }
    }
});
