"use strict";

var fluid = require("infusion");

require("./file-read.js");

// TODO: Write these
// # `POST /api/images/file/:uid/:source`
// # `PUT /api/images/file/:uid/:source/:image_id`
/*
This module supports reading JPEG, PNG, WebP, TIFF, GIF and SVG images.
Output images can be in JPEG, PNG and WebP formats as well as uncompressed raw pixel data.

webp -> png
tiff -> jpg
everything else is preserved unaltered

Scan uploaded images with clamav.
 */
// require("./file-update.js");

// TODO: Write these
// # `DELETE /api/images/file/:uid/:source/:image_id`
// require("./file-delete.js");

fluid.defaults("gpii.ul.api.images.file", {
    gradeNames: ["gpii.express.router"],
    path: "/file",
    events: {
        onReadReady: null,
        onReady: {
            onReadReady: "onReadReady"
        }
    },
    components: {
        read: {
            type: "gpii.ul.api.images.file.read",
            options: {
                originalsDir: "{gpii.ul.api.images}.options.originalsDir",
                cacheDir:     "{gpii.ul.api.images}.options.cacheDir",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api.images.file}.events.onReadReady.fire"
                    }
                }
            }
        }
    }
});
