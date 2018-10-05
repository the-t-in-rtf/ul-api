/*

    Display our API docs.  Requires an instance of `gpii.express` that has a copy of `gpii-handlebars` available to
    render the boilerplate content.

 */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var MarkDownIt = require("markdown-it");
var fs         = require("fs");

fluid.registerNamespace("gpii.ul.api.docs");

/**
 *
 * Read our documentation, render it, and send the rendered content to the user.
 *
 * Fulfills the standard contract for `gpii.express.middleware`:
 * https://github.com/GPII/gpii-express/blob/master/docs/middleware.md
 *
 * @param {Object} that - The component itself.
 * @param {Object} req - The request object.  See: https://github.com/GPII/gpii-express/blob/master/docs/express.md#the-express-request-object
 * @param {Object} res - The response object.  See: https://github.com/GPII/gpii-express/blob/master/docs/express.md#the-express-response-object
 *
 */
gpii.ul.api.docs.middleware = function (that, req, res) {
    var markdownSource = fs.readFileSync(fluid.module.resolvePath(that.options.mdFile), {encoding: "utf8"});
    var mdRenderer = new MarkDownIt();
    res.render(that.options.template, { "title": that.options.title, "body": mdRenderer.render(markdownSource), "layout": that.options.layout});
};

fluid.defaults("gpii.ul.api.docs", {
    gradeNames: ["gpii.express.middleware"],
    path:       ["/", "/docs"],
    method:     "get",
    template:   "pages/docs",
    layout:     "main",
    title:      "UL API Documentation",
    mdFile:     "%ul-api/docs/apidocs.md",
    invokers: {
        middleware: {
            funcName: "gpii.ul.api.docs.middleware",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    }
});
