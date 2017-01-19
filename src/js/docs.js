/*

    Display our API docs.  Requires an instance of `gpii.express` that has a copy of `gpii-handlebars` available to
    render the boilerplate content.

 */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var marked = require("marked");
var fs     = require("fs");

fluid.registerNamespace("gpii.ul.api.docs");

/**
 *
 * Read our documentation, render it, and send the rendered content to the user.
 *
 * Fulfills the standard contract for `gpii.express.middleware`:
 * https://github.com/GPII/gpii-express/blob/master/docs/middleware.md
 *
 * @param that - The component itself.
 * @param req - The request object.  See: https://github.com/GPII/gpii-express/blob/master/docs/express.md#the-express-request-object
 * @param res - The response object.  See: https://github.com/GPII/gpii-express/blob/master/docs/express.md#the-express-response-object
 *
 */
gpii.ul.api.docs.middleware = function (that, req, res) {
    var markdown = fs.readFileSync(fluid.module.resolvePath(that.options.mdFile), {encoding: "utf8"});
    res.render(that.options.template, { "title": that.options.title, "body": marked(markdown, that.options.markedOptions), "layout": that.options.layout});
};

fluid.defaults("gpii.ul.api.docs", {
    gradeNames: ["gpii.express.middleware"],
    path:       "/",
    method:     "get",
    template:   "pages/docs",
    layout:     "main",
    title:      "UL API Documentation",
    mdFile:     "%ul-api/docs/apidocs.md",
    markedOptions: {
    },
    invokers: {
        middleware: {
            funcName: "gpii.ul.api.docs.middleware",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    }
});
