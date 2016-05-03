// Display our API docs.  Requires an instance of `gpii.express` that has a copy of `gpii-handlebars` available to render
// the boilerplate content.
//
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var marked = require("marked");
var fs     = require("fs");

fluid.registerNamespace("gpii.ul.api.docs");

// TODO:  I have used this pattern before.  Confirm that this is not already available somewhere else.
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
    title:      "PTD API Documentation",
    mdFile:     "%gpii-ul-api/docs/apidocs.md",
    markedOptions: {
    },
    invokers: {
        middleware: {
            funcName: "gpii.ul.api.docs.middleware",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    }
});