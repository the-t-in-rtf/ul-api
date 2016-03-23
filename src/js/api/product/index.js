// All handlers for /api/record
"use strict";
var fluid = require("infusion");

require("gpii-express");

//require("./put");
//require("./post");
require("./get");
//require("./delete");

fluid.defaults("gpii.ul.api.product", {
    gradeNames: ["gpii.express.router.passthrough"],
    path:       "/product",
    method:     "use",
    components: {
        get: {
            type: "gpii.ul.api.product.get"
        }
        //,
        //put: {
        //    type: "gpii.ul.api.product.put"
        //},
        //post: {
        //    type: "gpii.ul.api.product.post"
        //},
        //"delete": {
        //    type: "gpii.ul.api.product.delete"
        //}
    }
});