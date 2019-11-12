/*

    The "read" portion of the GET /api/images/metadata endpoint.

    The views that back this endpoint use compound keys as outlined here:

    http://ryankirkman.com/2011/03/30/advanced-filtering-with-couchdb-views.html

    So, for `GET /api/images/metadata/:uid`, the request is something like:

    http://localhost:7318/images/_design/metadata/_view/combined?startkey=[%221421059432806-826608318%22]&endkey=[%221421059432806-826608318%22,{},{}]

    Note that the end of the range has two empty objects, which means we'll get every record with the first part of the compound key.

    For `GET /api/images/metadata/:uid/:source`, the request is something like:

    http://localhost:7318/images/_design/metadata/_view/combined?startkey=[%221421059432806-826608318%22,%20%22unified%22]&endkey=[%221421059432806-826608318%22,%20%22unified%22,%20{}]

    There we supply the first two pieces, and omit the third.

    For `GET /api/images/metadata/:uid/:source/:image_id`, the request is something like:

    http://localhost:7318/images/_design/metadata/_view/combined?key=[%221421059432806-826608318%22,%20%22contributor%22,%20%22e.svg%22]

    There we supply all three pieces (and use the `key` instead of `startkey` and `endkey`.

 */
"use strict";
var fluid = require("infusion");

var gpii   = fluid.registerNamespace("gpii");


fluid.require("%gpii-express");
fluid.require("%gpii-json-schema");

require("../source-permission-middleware");
require("../view-read-dataSource");

fluid.registerNamespace("gpii.ul.api.images.metadata.read.dataSource");

gpii.ul.api.images.metadata.read.dataSource.filterBySource = function (handler, unfilteredResults) {
    var user = handler.options.request.session && handler.options.request.session[handler.options.sessionKey];
    var authorizedSources = gpii.ul.api.sources.request.listSources(gpii.ul.api.sources.sources, user, "view");

    var filteredResults = fluid.copy(unfilteredResults);
    fluid.remove_if(filteredResults, function (record) {
        // Remove the record from the list if its source is not one we're authorized to see.
        return Boolean(authorizedSources.indexOf(record.source) === -1);
    });

    return filteredResults;
};

// Our "base" dataSource, designed to return a single record from an array of view results.
fluid.defaults("gpii.ul.api.images.metadata.read.dataSource", {
    gradeNames: ["gpii.ul.images.dataSources.couch"],
    baseUrl: "{gpii.ul.api}.options.urls.imageDb",
    endpoint: "/_design/metadata/_view/combined",
    listeners: {
        // Strip out any records we are not allowed to see
        "onRead.filterBySource": {
            namespace: "filter",
            priority:  "after:transform",
            funcName:  "gpii.ul.api.images.metadata.read.dataSource.filterBySource",
            args:      ["{gpii.express.handler}", "{arguments}.0"]
        },
        // On a successful read, send the transformed results.
        "onRead.sendResponse": {
            priority: "after:filter",
            func:     "{gpii.express.handler}.sendResponse",
            args:     [ 200, "{arguments}.0.0"] // statusCode, body
        },
        "onError.handleError": {
            func: "gpii.ul.api.images.metadata.read.handler.handleError",
            args: [ "{that}", "{arguments}.0."] // errorResponse
        }
    }
});

fluid.registerNamespace("gpii.ul.api.images.metadata.read.handler");

gpii.ul.api.images.metadata.read.handler.handleRequest = function (that) {
    var userOptions = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);

    var requestData = {
        startkey: [userOptions.uid],
        endkey:   [userOptions.uid, {}, {}]
    };

    if (userOptions.source) {
        requestData.startkey.push(userOptions.source);
        requestData.endkey[1] = userOptions.source;
    }

    // If we have all three options, request a single record.
    if (userOptions.image_id) {
        requestData.startkey.push(userOptions.image_id);
        that.singleRecordReader.get({ key: requestData.startkey });
    }
    // Otherwise, request multiple records.
    else {
        that.multiRecordReader.get(requestData);
    }

};

gpii.ul.api.images.metadata.read.handler.handleError = function (that, response) {
    var statusCode = response.statusCode || 500;
    if (statusCode === 404) {
        that.sendResponse( statusCode, { isError: true, message: that.options.messages.notFound});
    }
    else {
        that.sendResponse( statusCode, response);
    }
};

fluid.defaults("gpii.ul.api.images.metadata.read.handler", {
    gradeNames: ["gpii.express.handler"],
    rules: {
        requestContentToValidate: "{gpii.ul.api.images.metadata.read.base}.options.rules.requestContentToValidate"
    },
    messages: {
        notFound: "The image ID you have supplied does not correspond to an existing metadata record."
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.images.metadata.read.handler.handleRequest",
            args:     ["{that}"]
        }
    },
    components: {
        singleRecordReader: {
            type: "gpii.ul.api.images.metadata.read.dataSource"
        },
        // A dataSource designed to filter a larger array of records by source.  Required because of the
        // `GET /api/images/metadata/:uid` endpoint, which would otherwise return information about records
        // the current user should not be able to see.
        multiRecordReader: {
            type: "gpii.ul.api.images.metadata.read.dataSource",
            options: {
                listeners: {
                    // Send the filtered results to the user.
                    "onRead.sendResponse": {
                        priority: "after:filter",
                        func: "{gpii.express.handler}.sendResponse",
                        args: [ 200, "{arguments}.0"] // statusCode, body
                    }
                }
            }
        }
    }
});

fluid.defaults("gpii.ul.api.images.metadata.read.base", {
    gradeNames: ["gpii.express.router"],
    method: ["get"],
    // Support all variations, including those with missing URL params so that we can return appropriate error feedback.
    path: ["/:uid/:source/:image_id", "/:uid/:source", "/:uid", "/"],
    routerOptions: {
        mergeParams: true
    },
    rules: {
        requestContentToValidate: {
            "": "params",
            source: {
                transform: {
                    type: "fluid.transforms.firstValue",
                    values: [
                        "params.source",
                        {
                            transform: {
                                type: "fluid.transforms.literalValue",
                                input: "unified"
                            }
                        }
                    ]
                }
            }
        }
    },
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
                    requestContentToValidate: "{gpii.ul.api.images.metadata.read.base}.options.rules.requestContentToValidate"
                },
                inputSchema:  {
                    "title": "UL Image API metadata 'read' input schema",
                    "type": "object",
                    "properties": {
                        "uid": gpii.ul.api.schemas.required.product.uid,
                        "source": gpii.ul.api.schemas.required.product.source,
                        "image_id": {
                            "type": "string"
                        }
                    }
                }
            }
        }
    }
});

fluid.defaults("gpii.ul.api.images.metadata.read", {
    gradeNames: ["gpii.ul.api.images.metadata.read.base"],
    components: {
        // If our request is valid, handle it normally.
        metadataMiddleware: {
            type: "gpii.express.middleware.requestAware",
            options: {
                priority: "after:validationMiddleware",
                handlerGrades: ["gpii.ul.api.images.metadata.read.handler"]
            }
        }
    }
});
