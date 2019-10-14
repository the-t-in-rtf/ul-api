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

require("./source-permission-middleware");
require("./view-read-dataSource");

// Our "base" dataSource, designed to return a single record from an array of view results.
fluid.defaults("gpii.ul.api.images.bySource.dataSource", {
    gradeNames: ["gpii.ul.images.dataSources.couch"],
    baseUrl: "{gpii.ul.api}.options.urls.imageDb",
    endpoint: "/_design/metadata/_view/bySource"
});

fluid.registerNamespace("gpii.ul.api.images.bySource.handler");

gpii.ul.api.images.bySource.handler.handleRequest = function (that) {
    var source = fluid.get(that.options.request, "params.source");
    var promise = that.reader.get({ key: source });
    promise.then(that.handleSuccess, that.handleError);
};

gpii.ul.api.images.bySource.handler.handleSuccess = function (that, records) {
    var source = fluid.get(that.options.request, "params.source");
    that.sendResponse(200, { source: source, records: records});
};

gpii.ul.api.images.bySource.handler.handleError = function (that, response) {
    var statusCode = response.statusCode || 500;
    that.sendResponse(statusCode, response);
};

fluid.defaults("gpii.ul.api.images.bySource.handler", {
    gradeNames: ["gpii.express.handler"],
    rules: {
        requestContentToValidate: {
            "": ""
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.images.bySource.handler.handleRequest",
            args:     ["{that}"]
        },
        handleSuccess: {
            funcName: "gpii.ul.api.images.bySource.handler.handleSuccess",
            args:     ["{that}", "{arguments}.0"]
        },
        handleError: {
            funcName: "gpii.ul.api.images.bySource.handler.handleError",
            args:     ["{that}", "{arguments}.0"]
        }
    },
    components: {
        reader: {
            type: "gpii.ul.api.images.bySource.dataSource"
        }
    }
});

fluid.defaults("gpii.ul.api.images.bySource", {
    gradeNames: ["gpii.express.router"],
    method:     ["get"],
    path:       ["/:source"],
    routerOptions: {
        mergeParams: true
    },
    components: {
        // Make sure the user has permission to view (non-unified) image sources.
        permissionMiddleware: {
            type: "gpii.ul.images.sourcePermissionMiddleware",
            options: {
                priority: "first"
            }
        },
        metadataMiddleware: {
            type: "gpii.express.middleware.requestAware",
            options: {
                priority: "after:permissionMiddleware",
                handlerGrades: ["gpii.ul.api.images.bySource.handler"]
            }
        }
    }
});
