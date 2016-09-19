// A.404.handler for anything whose path doesn't match another endpoint
/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("gpii-express");

require("./lib/htmlMessageHandler");

fluid.defaults("gpii.ul.api.404.handler", {
    gradeNames:  ["gpii.express.handler"],
    messageBody: { isError: true, statusCode: 404, message: "The API endpoint you requested could not be found.  Please check the documentation and try again." }
});

fluid.defaults("gpii.ul.api.404.handler.json", {
    gradeNames:  ["gpii.ul.api.404.handler"],
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [ 404, "{that}.options.messageBody"] // statusCode, body
        }
    }
});

// TODO:  Replace with gpii.express.singleTemplateMiddleware
fluid.defaults("gpii.ul.api.404.handler.html", {
    gradeNames: ["gpii.ul.api.404.handler", "gpii.ul.api.htmlMessageHandler.staticBody"],
    templateKey: "pages/error.handlebars"
});

fluid.defaults("gpii.ul.api.404", {
    gradeNames: ["gpii.express.middleware.contentAware"],
    path: "/",
    namespace: "404",
    handlers: {
        "default": {
            priority:      "first",
            contentType:   "text/html",
            handlerGrades: ["gpii.ul.api.404.handler.html"]
        },
        json: {
            contentType: "application/json",
            handlerGrades: ["gpii.ul.api.404.handler.json"]
        }
    }
});
