// All handlers for /api/record
"use strict";
var fluid = require("infusion");

require("gpii-express");

//require("./put");
//require("./post");
require("./get");
//require("./delete");

fluid.defaults("gpii.ul.api.product", {
    gradeNames: ["gpii.express.router"],
    path:       "/product",
    method:     "use",
    events: {
        onGetSchemasDereferenced: null,
        onSchemasDereferenced: {
            events: {
                onGetSchemasDereferenced: "onGetSchemasDereferenced"
            }
        }
    },
    components: {
        get: {
            type: "gpii.ul.api.product.get",
            options: {
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api.product}.events.onGetSchemasDereferenced.fire"
                    }
                }
            }
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