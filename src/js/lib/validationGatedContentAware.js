/*

    A grade that hides a `contentAware` router behind a schema validation layer, including all required HTML and JSON
    error handling.

 */
"use strict";
var fluid = require("infusion");

fluid.defaults("gpii.ul.api.validatingEndpoint", {
    gradeNames: ["gpii.express.router"],
    events: {
        onSchemasDereferenced: null
    },
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
    components: {
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                priority:   "first",
                rules: "{gpii.ul.api.validatingEndpoint}.options.rules",
                schemaDirs: "{gpii.ul.api}.options.schemaDirs",
                schemaKey:  "{gpii.ul.api.validatingEndpoint}.options.schemas.input",
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
        }
    }
});

fluid.defaults("gpii.ul.api.validationGatedContentAware", {
    gradeNames: ["gpii.ul.api.validatingEndpoint"],
    events: {
        onSchemasDereferenced: null
    },
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
