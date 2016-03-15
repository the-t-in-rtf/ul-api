// The API that powers the Unified Listing.  See the API docs (/api/docs) for details.
"use strict";
var fluid = require("infusion");

require("gpii-express");
require("gpii-express-user");
require("gpii-handlebars");

require("./docs");
//require("./product");
//require("./products");
//require("./search");
//require("./updates");
//require("./sources");

fluid.defaults("gpii.ul.api", {
    gradeNames:   ["gpii.express.router.passthrough"],
    path:         "/api",
    templateDirs: "%ul-api/src/templates",
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
        docs: {
            type: "gpii.ul.api.docs"
        },
        //product: {
        //    type: "gpii.ul.api.product"
        //},
        //products: {
        //    type: "gpii.ul.api.products"
        //},
        //search: {
        //    type: "gpii.ul.api.products"
        //},
        //sources: {
        //    type: "gpii.ul.api.sources.router",
        //    options: {
        //        path: "/sources"
        //    }
        //},
        //updates: {
        //    type: "gpii.ul.api.updates.router",
        //    options: {
        //        path: "/updates",
        //        couch: "{gpii.express}.options.config.couch"
        //    }
        //},
        user: {
            type: "gpii.express.user.api",
            options: {
                app:       "{gpii.express}.options.config.app",
                couch: {
                    userDbName: "users",
                    userDbUrl: "{gpii.ul.api}.options.couch.urls.users"
                }
            }
        }
    }
});