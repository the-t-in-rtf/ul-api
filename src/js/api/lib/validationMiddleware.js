/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.defaults("gpii.ul.api.middleware.validationMiddleware", {
    gradeNames: ["gpii.schema.validationMiddleware"],
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
    messages: {
        error: "The information you provided is incomplete or incorrect.  Please check the following:"
    }
});
