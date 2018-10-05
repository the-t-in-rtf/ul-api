"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.api.middleware.initialHtmlForm");

/**
 *
 * A simple "gating" function to ensure that the form is only rendered if the client accepts the right content type.
 * This must be a separate piece of middleware and must be loaded before the schema validation because we serve the
 * initial form whether or not we have query data.
 *
 * @param {Object} that - The middleware component itself.
 * @param {Object} request - The Express request object.
 * @param {Object} response - The Express response object.
 * @param {Function} next - The next piece of middleware in the chain.
 */
gpii.ul.api.middleware.initialHtmlForm.renderFormOrDefer = function (that, request, response, next) {
    if (request.accepts(that.options.contentTypes)) {
        gpii.express.singleTemplateMiddleware.renderForm(that, request, response);
    }
    else {
        next();
    }
};

// A component to serve up an initial form.  Intended to be loaded before any JSON validation or handling.
fluid.defaults("gpii.ul.api.middleware.initialHtmlForm", {
    gradeNames: ["gpii.express.singleTemplateMiddleware"],
    contentTypes: ["text/html"],
    invokers: {
        middleware: {
            funcName: "gpii.ul.api.middleware.initialHtmlForm.renderFormOrDefer",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] //request, response, next
        }
    }
});
