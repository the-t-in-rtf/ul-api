/*

    The API that powers the Unified Listing.  See the API docs for details:

    https://github.com/GPII/ul-api/blob/master/docs/apidocs.md

 */
"use strict";
var fluid = require("infusion");

require("gpii-express");
require("gpii-express-user");

require("./schemas");
require("./docs");
require("./product");
require("./products");
require("./search");
require("./sources");
require("./updates");
require("./images");
require("./merge");
require("./eastin");

fluid.defaults("gpii.ul.api", {
    gradeNames:   ["gpii.express.router", "gpii.hasRequiredOptions"],
    requiredFields: {
        originalsDir: true,
        cacheDir:     true
    },
    path:         "/api",
    templateDirs: {
        api: {
            path: "%ul-api/src/templates",
            priority: "before:user"
        },
        user: {
            path: "%gpii-express-user/src/templates",
            priority: "before:validation"
        },
        validation: {
            priority: "last",
            path: "%gpii-json-schema/src/templates"
        }
    },
    sessionKey: "_ul_user",
    distributeOptions: [
        {
            source: "{that}.options.sessionKey",
            target: "{that gpii.express.handler}.options.sessionKey"
        },
        {
            source: "{that}.options.rules.contextToExpose",
            target: "{that gpii.ul.api.htmlMessageHandler}.options.rules.contextToExpose"
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
        eastin: {
            type: "gpii.ul.api.eastin",
            options: {
                priority: "after:urlencoded"
            }
        },
        handlebars: {
            type: "gpii.express.hb",
            options: {
                priority: "after:urlencoded",
                templateDirs: "{gpii.ul.api}.options.templateDirs",
                components: {
                    renderer: {
                        options: {
                            components: {
                                initBlock: {
                                    options: {
                                        contextToOptionsRules: {
                                            req: {
                                                "params": "req.params",
                                                "query":  "req.query"
                                            },
                                            product:  "product",
                                            products: "products",
                                            model: {
                                                user:     "req.session._ul_user",
                                                product:  "product",
                                                products: "products"
                                            }
                                        }
                                    }
                                }
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
                priority: "after:user"
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
        imageApi: {
            type: "gpii.ul.api.images",
            options: {
                priority:     "after:updates",
                templateDirs: "{gpii.ul.api}.options.templateDirs",
                urls:         "{gpii.ul.api}.options.urls",
                originalsDir: "{gpii.ul.api}.options.originalsDir",
                cacheDir:     "{gpii.ul.api}.options.cacheDir"
            }
        },
        merge: {
            type: "gpii.ul.api.merge",
            options: {
                priority: "after:updates"
            }
        },
        docs: {
            type: "gpii.ul.api.docs",
            options: {
                priority: "after:updates"
            }
        },
        htmlErrorHandler: {
            type:     "gpii.handlebars.errorRenderingMiddleware",
            options: {
                priority: "after:docs",
                templateKey: "pages/error"
            }
        },
        jsonErrors: {
            type: "gpii.express.middleware.error",
            options: {
                priority: "after:htmlErrorHandler",
                rules: {
                    errorOutputRules: {
                        "":     ""
                    }
                }
            }
        }
    }
});
