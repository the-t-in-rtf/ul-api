/*

    The "read" portion of the GET /api/images/gallery endpoint.  As this uses much of the same data as the
    /api/images/metadata read endpoint, it extends that grade.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../metadata/metadata-read");


fluid.registerNamespace("gpii.ul.api.images.gallery.read.dataSource");

gpii.ul.api.images.gallery.read.dataSource.handleGalleryResponse = function (handler, response) {
    var userOptions = fluid.model.transformWithRules(handler.options.request, handler.options.rules.requestContentToValidate);

    var images = handler.metadata;
    if (response && response.length > 0) {
        var imagesById = {};
        fluid.each(handler.metadata, function (record) {
            imagesById[record.image_id] = record;
        });

        images = [];

        fluid.each(response, function (galleryEntry) {
            fluid.each(galleryEntry.images, function (image_id) {
                var imageRecord = imagesById[image_id];
                // Guard against broken record->record links (bad "image_id" values).
                if (imageRecord) {
                    images.push(imageRecord);
                }
            });
        });
    }

    handler.sendResponse(200, {
        uid: userOptions.uid,
        images: images
    });
};

// Our "base" dataSource, designed to return a single record from an array of view results.
fluid.defaults("gpii.ul.api.images.gallery.read.dataSource", {
    gradeNames: ["gpii.ul.images.dataSources.couch"],
    baseUrl:    "{gpii.ul.api}.options.urls.imageDb",
    endpoint:   "/_design/gallery/_view/byUid",
    rules: {
        transformRecord: gpii.ul.images.dataSources.couch.rules.transformRecord.gallery
    },
    listeners: {
        // If there is a custom gallery record, use that to construct the response.
        "onRead.prepareResponse": {
            priority: "after:filter",
            funcName: "gpii.ul.api.images.gallery.read.dataSource.handleGalleryResponse",
            args:     ["{gpii.express.handler}", "{arguments}.0"] // statusCode, body
        },
        // If there's no custom gallery record, proceed with the defaults.
        "onError.prepareResponse": {
            funcName: "gpii.ul.api.images.gallery.read.dataSource.handleGalleryResponse",
            args:     ["{gpii.express.handler}", false, "{arguments}.0"]
        }
    }
});

fluid.registerNamespace("gpii.ul.api.images.gallery.read.handler");

gpii.ul.api.images.gallery.read.handler.handleRequest = function (that) {
    var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    var requestData = {
        startkey: [userOptions.uid, "unified"],
        endkey:   [userOptions.uid, "unified", {}]
    };

    that.metadataReader.get(requestData);
};

gpii.ul.api.images.gallery.read.handler.handleMetadataResponse = function (handler, response) {
    handler.metadata = response;

    var userOptions = fluid.model.transformWithRules(handler.options.request, handler.options.rules.requestContentToValidate);

    handler.galleryReader.get({ key: userOptions.uid });
};

fluid.defaults("gpii.ul.api.images.gallery.read.handler", {
    gradeNames: ["gpii.express.handler"],
    messages: {
        notFound: "There are no images "
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.images.gallery.read.handler.handleRequest",
            args:     ["{that}"]
        }
    },
    members: {
        metadata: []
    },
    components: {
        galleryReader: {
            type: "gpii.ul.api.images.gallery.read.dataSource"
        },
        metadataReader: {
            type: "gpii.ul.images.dataSources.couch",
            options: {
                baseUrl: "{gpii.ul.api}.options.urls.imageDb",
                endpoint: "/_design/metadata/_view/combined",
                listeners: {
                    // Save the data and start the next part of the process
                    "onRead.handleMetadataResponse": {
                        priority: "after:filter",
                        funcName: "gpii.ul.api.images.gallery.read.handler.handleMetadataResponse",
                        args:     ["{gpii.express.handler}", "{arguments}.0"] // statusCode, body
                    }
                }
            }
        }
    }
});

fluid.defaults("gpii.ul.api.images.gallery.read", {
    gradeNames: ["gpii.ul.api.images.metadata.read.base"],
    // Support all variations, including those with missing URL params so that we can return appropriate error feedback.
    path: ["/:uid", "/"],
    components: {
        validationMiddleware: {
            options: {
                schemaKey:  "gallery-read-input.json"
            }
        },
        // If our request is valid, handle it normally.
        galleryMiddleware: {
            type: "gpii.express.middleware.requestAware",
            options: {
                priority: "after:validationMiddleware",
                handlerGrades: ["gpii.ul.api.images.gallery.read.handler"]
            }
        }
    }
});
