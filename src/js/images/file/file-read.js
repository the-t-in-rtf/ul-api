/*

    Provides the REST endpoints to retrieve a specific image file:

    * `GET /api/images/file/:uid/:source/:image_id`
    * `GET /api/images/file/:uid/:source/:width/:image_id`

    Also provides the REST endpoint to retrieve file metadata for a particular file, which allows browsers to check the
    staleness of their cache.  See the API docs for details.

    * `HEAD /api/images/file/:uid/:source/:image_id`
    * `HEAD /api/images/file/:uid/:source/:width/:image_id`

 */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var fs     = require("fs");
var sharp  = require("sharp");
var mkdirp = require("mkdirp");

fluid.require("%gpii-express");
fluid.require("%gpii-json-schema");

fluid.registerNamespace("gpii.ul.api.images.file.read.handler");

require("./file-helpers");
require("../source-permission-middleware");

gpii.ul.api.images.file.read.handler.checkQueryParams = function (that) {
    // Use the same rules to extract the user input as we do during validation.
    var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    if (userOptions.width) {
        // If we have height/width params, check to see if we already have a resized file
        // /api/images/file/:uid/:source/:width/:image_id
        var originalSegments  = [ userOptions.uid, userOptions.source,  userOptions.image_id ];
        var originalFilePath  = gpii.ul.api.images.file.resolvePath(that.options.originalsDir, originalSegments);

        var resizedDirSegments = [ userOptions.uid, userOptions.source,  userOptions.width];
        var resizedDirPath     = gpii.ul.api.images.file.resolvePath(that.options.cacheDir, resizedDirSegments);
        var resizedFilePath    = gpii.ul.api.images.file.resolvePath(resizedDirPath, userOptions.image_id );

        // If a resized file exists, defer to the static middleware
        if (fs.existsSync(resizedFilePath)) {
            that.options.next();
        }
        // If we don't have a resized file, create one.
        else {
            if (fs.existsSync(originalFilePath)) {
                try {
                    mkdirp.sync(resizedDirPath);

                    try {
                        var tileSize = parseInt(userOptions.width, 10);
                        sharp(originalFilePath)
                            .background("white") // Ideally we would use transparent, but for image formats (JPG) that lack transparency, this becomes black.
                            .resize(tileSize, tileSize) // Create a square tile
                            .embed() // embed the original image within the square tile rather than changing its aspect ratio.
                            .toFile(resizedFilePath, function (error) {
                                if (error) {
                                    that.sendResponse(500, { isError: true, message: that.options.messages.saveError });
                                }
                                else {
                                    that.options.next(); // If we've made it this far, we can defer to the static middleware.
                                }
                            });
                    }
                    catch (error) {
                        that.sendResponse(500, { isError: true, message: that.options.messages.resizeError });
                    }
                }
                catch (error) {
                    that.sendResponse(500, { isError: true, message: that.options.messages.mkdirError });
                }
            }
            else {
                that.sendResponse(404, { isError: true, message: that.options.messages.fileNotFound});
            }
        }
    }
    // For original unaltered images, defer to the static middleware
    else {
        that.options.next();
    }
};

fluid.defaults("gpii.ul.api.images.file.read.handler", {
    gradeNames: ["gpii.express.handler"],
    rules: {
        requestContentToValidate: "{gpii.ul.api.images.file.read}.options.rules.requestContentToValidate"
    },
    messages: {
        fileNotFound: "Can't find an original image to resize.",
        mkdirError:   "Error creating directory to hold resized image",
        resizeError:  "Error resizing original image.",
        saveError:    "Error saving resized image to disk."
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.images.file.read.handler.checkQueryParams",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.ul.api.images.file.read", {
    gradeNames: ["gpii.express.router", "gpii.hasRequiredOptions"],
    method: ["get", "head"],
    requiredFields: {
        "originalsDir": true, // Where to store the originals.
        "cacheDir":     true  // Where to store resized images.
    },
    // Support all variations, including those with missing URL params so that we can return appropriate error feedback.
    path: ["/:uid/:source/:width/:image_id", "/:uid/:source/:image_id", "/:uid/:source", "/:uid", "/"],
    routerOptions: {
        mergeParams: true
    },
    rules: {
        requestContentToValidate: {
            "": "params"
        }
    },
    distributeOptions: [
        {
            source: "{that}.options.cacheDir",
            target: "{that gpii.express.handler}.options.cacheDir"
        },
        {
            source: "{that}.options.originalsDir",
            target: "{that gpii.express.handler}.options.originalsDir"
        }
    ],
    components: {
        // Make sure the user has permission to view (non-unified) image sources.
        permissionMiddleware: {
            type: "gpii.ul.images.sourcePermissionMiddleware",
            options: {
                priority: "first"
            }
        },
        // Reject requests that have missing or bad data up front.
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                priority: "after:permissionMiddleware",
                rules: {
                    requestContentToValidate: "{gpii.ul.api.images.file.read}.options.rules.requestContentToValidate"
                },
                inputSchema: {
                    "title": "File reader input Schema",
                    "type": "object",
                    "properties": {
                        "uid": gpii.ul.api.schemas.required.product.uid,
                        "source": gpii.ul.api.schemas.required.product.source,
                        "image_id": {
                            "required": true,
                            "type": "string",
                            "errors": {
                                "type": "The 'image_id' URL parameter must be a valid string."
                            }
                        },
                        "width": {
                            "type": "string",
                            "errors": {
                                "type": "The 'width' query parameter must be a valid string."
                            }
                        }
                    }
                }
            }
        },
        // Intermediate middleware to check for custom height/width and existence of original
        resizingMiddleware: {
            type: "gpii.express.middleware.requestAware",
            options: {
                priority: "after:validationMiddleware",
                handlerGrades: ["gpii.ul.api.images.file.read.handler"]
            }
        },
        static: {
            type:     "gpii.express.router.static",
            options: {
                priority: "last",
                content: ["{gpii.ul.api.images.file.read}.options.originalsDir", "{gpii.ul.api.images.file.read}.options.cacheDir"]
            }
        }
    }
});
