/*

    A grade that hides a `contentAware` router behind a schema validation layer, including all required HTML and JSON
    error handling.

 */
"use strict";
var fluid = require("infusion");

fluid.defaults("gpii.ul.api.validatingEndpoint", {
    gradeNames: ["gpii.express.router"],
    components: {
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                priority:   "first",
                messages: {
                    error: "The information you provided is incomplete or incorrect.  Please check the following:"
                }
            }
        },
        // We let JSON errors fall back to a more general handler, but render HTML errors ourselves
        renderedValidationError: {
            type: "gpii.handlebars.errorRenderingMiddleware",
            options: {
                priority: "after:validationMiddleware",
                templateKey: "pages/validation-error"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.validationGatedContentAware", {
    gradeNames: ["gpii.ul.api.validatingEndpoint"],
    components: {
        contentAwareMiddleware: {
            type: "gpii.express.middleware.contentAware",
            options: {
                priority: "after:renderedValidationError",
                handlers: "{gpii.ul.api.validationGatedContentAware}.options.handlers"
            }
        }
    }
});
