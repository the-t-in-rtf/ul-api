// TODO: Pull this up and use it across the UL API, replacing the one-off source permission checks.
/*

    Middleware to automatically reject as unauthorized requests for a source the user does not have permission to
    read/write.  Note that this middleware must be wired in after the session middleware, and that it must attempt to
    access the same session key as you use in the reset of your application.  You must also ensure that the middleware
    will be aware of the `source` parameter.  By default, this is pulled from `request.params.source`, you can
    change this behavior by overriding the model transformation rules found in `options.rules.sourceFromRequest`.

*/
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../sources/");

fluid.registerNamespace("gpii.ul.images.sourcePermissionMiddleware");

gpii.ul.images.sourcePermissionMiddleware.middleware = function (that, request, response, next) {
    var user = request.session && request.session[that.options.sessionKey];
    var source = fluid.model.transformWithRules(request, that.options.rules.sourceFromRequest);
    var authorizedSources = gpii.ul.api.sources.request.listSources(gpii.ul.api.sources.sources, user, that.options.permission);
    if (!source || Object.keys(source).length === 0 || authorizedSources.indexOf(source) !== -1) {
        next();
    }
    else {
        response.status(401).send({ isError: true, statusCode: 401, message: that.options.errorMessages.notAuthorized});
    }
};

fluid.defaults("gpii.ul.images.sourcePermissionMiddleware", {
    gradeNames: ["gpii.express.middleware"],
    permission: "view",
    sessionKey: "_ul_user",
    rules: {
        sourceFromRequest: {
            "": "params.source"
        }
    },
    errorMessages: {
        notAuthorized: {
            expander: {
                funcName: "fluid.stringTemplate",
                args: ["You are not authorized to %permission this source.", { permission: "{that}.options.permission" }]
            }
        }
    },
    invokers: {
        middleware: {
            funcName: "gpii.ul.images.sourcePermissionMiddleware.middleware",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // request, response, next
        }
    }
});

fluid.defaults("gpii.ul.images.sourcePermissionMiddleware.write", {
    gradeNames: ["gpii.ul.images.sourcePermissionMiddleware"],
    permission: "write"
});
