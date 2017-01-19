"use strict";
var fluid = require("infusion");

require("./gallery-read");

/*

// TODO: Implement "write" interface
// TODO:  All must add "type: gallery" to the incoming records
# `PUT /api/images/gallery/:uid`
# `DELETE /api/images/gallery/:uid`

*/

fluid.defaults("gpii.ul.api.images.gallery", {
    gradeNames: ["gpii.express.router"],
    path: "/gallery",
    events: {
        onReadReady: null,
        onReady: {
            onReadReady: "onReadReady"
        }
    },
    components: {
        read: {
            type: "gpii.ul.api.images.gallery.read",
            options: {
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api.images.gallery}.events.onReadReady.fire"
                    }
                }
            }
        }
    }
});
