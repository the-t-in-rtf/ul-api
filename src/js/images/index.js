"use strict";
var fluid = require("infusion");

fluid.require("%gpii-express");

require("./file");
require("./metadata");
require("./gallery");
require("./bySource");

/*

 TODO: Implement the "write" portions of the API.

 // TODO:  All must strip "type", "_id", and "_rev" from the raw couch records
 # `GET /api/images/reports`
 # `GET /api/images/reports/contributions`
 // /:uid/:source
 // http://localhost:7318/images/_design/metadata/_view/combined?startkey=[%221421059432806-826608318%22,%20%22unified%22]&endkey=[%221421059432806-826608318%22,%20%22unified%22,%20{}]
 # `GET /api/images/reports/reviewers{?includeReviewed}`
 // /:uid
 // http://localhost:7318/images/_design/metadata/_view/combined?startkey=[%221421059432806-826608318%22,%20%22unified%22]&endkey=[%221421059432806-826608318%22,%20%22unified%22,%20{}]


 # `POST /api/images/file/:uid/:source/:image_id`

 # `PUT /api/images/approve`
 # `PUT /api/images/reject`

*/

fluid.defaults("gpii.ul.api.images", {
    gradeNames: ["gpii.express.router", "gpii.hasRequiredOptions"],
    requiredFields: {
        "urls.imageDb": true // The location of the images database
    },
    path: "/images",
    method: "use",
    events: {
        onFileEndpointReady:     null,
        onGalleryEndpointReady:  null,
        onMetadataEndpointReady: null,
        // Various child middleware isn't ready until JSON Schemas are resolved, all are rolled up here.
        onReady: {
            onFileEndpointReady:     "onFileEndpointReady",
            onGalleryEndpointReady:  "onGalleryEndpointReady",
            onMetadataEndpointReady: "onMetadataEndpointReady"
        }
    },
    components: {
        file: {
            type: "gpii.ul.api.images.file",
            options: {
                listeners: {
                    "onReady.notifyParent": {
                        func: "{gpii.ul.api.images}.events.onFileEndpointReady.fire"
                    }
                }
            }
        },
        gallery: {
            type: "gpii.ul.api.images.gallery",
            options: {
                listeners: {
                    "onReady.notifyParent": {
                        func: "{gpii.ul.api.images}.events.onGalleryEndpointReady.fire"
                    }
                }
            }
        },
        metadata: {
            type: "gpii.ul.api.images.metadata",
            options: {
                listeners: {
                    "onReady.notifyParent": {
                        func: "{gpii.ul.api.images}.events.onMetadataEndpointReady.fire"
                    }
                }
            }
        },
        bySource: {
            type: "gpii.ul.api.images.bySource",
            options: {
                priority: "after:metadata"
            }
        },
        docs: {
            type: "gpii.ul.api.docs",
            options: {
                priority: "after:bySource",
                mdFile: "%ul-api/docs/image-apidocs.md"
            }
        }
    }
});
