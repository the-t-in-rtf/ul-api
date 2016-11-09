// All handlers for /api/record
/* eslint-env node */
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
    events: {
        onDeleteSchemasDereferenced: null,
        onGetSchemasDereferenced: null,
        onUpdateSchemasDereferenced: null,
        onSchemasDereferenced: {
            events: {
                onDeleteSchemasDereferenced: "onDeleteSchemasDereferenced",
                onGetSchemasDereferenced:    "onGetSchemasDereferenced",
                onUpdateSchemasDereferenced: "onUpdateSchemasDereferenced"
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
        },
        // POST and PUT are backed by the same endpoint
        update: {
            type: "gpii.ul.api.product.update",
            options: {
                priority: "after:get",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api.product}.events.onUpdateSchemasDereferenced.fire"
                    }
                }
            }
        },
        "delete": {
            type: "gpii.ul.api.product.delete",
            options: {
                priority: "after:update",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api.product}.events.onDeleteSchemasDereferenced.fire"
                    }
                }
            }
        }
    }
});
