"use strict";
var fluid = require("infusion");

require("./metadata-read");

/*

// TODO: Implement "write" interface

// TODO:  Both must add "type: metadata" to the incoming records to distinguish from "gallery" entries.
# `POST /api/images/metadata/:uid/:source`
# `PUT /api/images/metadata/:uid/:source/:image_id`

# `DELETE /api/images/metadata/:uid/:source/:image_id`

*/

fluid.defaults("gpii.ul.api.images.metadata", {
    gradeNames: ["fluid.express.router"],
    path: "/metadata",
    components: {
        read: {
            type: "gpii.ul.api.images.metadata.read"
        }
    }
});
