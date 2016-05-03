/*

    The API that powers the Unified Listing.  See the API docs for details:

    https://github.com/GPII/ul-api/blob/master/docs/apidocs.md

 */
"use strict";
var fluid = require("infusion");

require("gpii-express");
require("gpii-express-user");

require("./docs");
require("./product");
//require("./products");
//require("./search");
//require("./updates");
//require("./sources");
require("./404");

fluid.defaults("gpii.ul.api", {
    gradeNames:   ["gpii.express.router"],
    path:         "/api",
    templateDirs: ["%gpii-ul-api/src/templates", "%gpii-express-user/src/templates", "%gpii-json-schema/src/templates"],
    schemaDirs:   ["%gpii-ul-api/src/schemas", "%gpii-express-user/src/schemas"],
    couch: {
        db:  "ul",
        urls: {
            base: "http://localhost:5984",
            db:   {
                expander: {
                    funcName: "fluid.stringTemplate",
                    args:     ["%baseUrl/%db", { baseUrl: "{that}.options.couch.urls.base", db: "{that}.options.couch.db" }]
                }
            },
            users:   {
                expander: {
                    funcName: "fluid.stringTemplate",
                    args:     ["%baseUrl/users", { baseUrl: "{that}.options.couch.urls.base" }]
                }
            }
        }
    },
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
        product: {
            type: "gpii.ul.api.product",
            options: {
                priority: "after:corsHeaders"
            }
        },
        //products: {
        //    type: "gpii.ul.api.products",
        // options: {
        //     priority: "after:docs"
        // }
        //},
        //search: {
        //    type: "gpii.ul.api.products",
        // options: {
        //     priority: "after:docs"
        // }
        //},
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
        // TODO:  Confirm that this is working in context by rerunning the tests from gpii-express-user
        user: {
            type: "gpii.express.user.api",
            options: {
                templateDirs: "{gpii.ul.api}.options.templateDirs",
                // TODO:  Update this
                app:       "{gpii.express}.options.config.app",
                couch: {
                    userDbName: "users",
                    userDbUrl: "{gpii.ul.api}.options.couch.urls.users"
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
                priority: "after:htmlErrorHandler"
            }
        },
        docs: {
            type: "gpii.ul.api.docs",
            options: {
                priority: "after:jsonErrorHandler"
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