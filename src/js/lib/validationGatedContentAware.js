/*

    A grade that hides a `contentAware` router behind a schema validation layer, including all required HTML and JSON
    error handling.

 */
"use strict";
var fluid = require("infusion");

// TODO:  Move this to gpii-json-schema once we've exercised it a bit here.
fluid.defaults("gpii.ul.api.validationGatedContentAware", {
    gradeNames: ["gpii.express.router"],
    events: {
        onSchemasDereferenced: null
    },
    components: {
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                priority:   "first",
                rules: {
                    validationErrorsToResponse: {
                        isError:    { literalValue: true },
                        statusCode: { literalValue: 400 },
                        message: {
                            literalValue: "{that}.options.messages.error"
                        },
                        fieldErrors: ""
                    }
                },
                schemaDirs: "{gpii.ul.api}.options.schemaDirs",
                schemaKey:  "{gpii.ul.api.validationGatedContentAware}.options.schemas.input",
                messages: {
                    error: "The information you provided is incomplete or incorrect.  Please check the following:"
                },
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.ul.api.validationGatedContentAware}.events.onSchemasDereferenced.fire"
                    }
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
        },
        // TODO:  Add JSON Schema header information about our error format
        // If we've made it this far, we don't need the above headers
        contentAwareMiddleware: {
            type: "gpii.express.middleware.contentAware",
            options: {
                priority: "after:renderedValidationError",
                handlers: "{gpii.ul.api.validationGatedContentAware}.options.handlers"
            }
        }
    }
});
