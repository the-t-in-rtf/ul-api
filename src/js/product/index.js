// All handlers for /api/record
"use strict";
var fluid = require("infusion");

require("gpii-express");

require("./get");
require("./update");
require("./delete");

fluid.defaults("gpii.ul.api.product", {
    gradeNames: ["gpii.express.router"],
    path:       "/product",
    method:     "use",
    components: {
        get: {
            type: "gpii.ul.api.product.get"
        },
        // POST and PUT are backed by the same endpoint
        update: {
            type: "gpii.ul.api.product.update",
            options: {
                priority: "after:get"
            }
        },
        "delete": {
            type: "gpii.ul.api.product.delete",
            options: {
                priority: "after:update"
            }
        }
    }
});
