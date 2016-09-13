// handle POST /api/product
/* eslint-env node */
"use strict";

// TODO:  Check permissions based on something like:
// var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
// gpii.ul.api.sources.request.listWritableSources(gpii.ul.api.sources.sources, that.options.request.session.user);

module.exports = function (config) {
    var fluid = require("infusion");

    var namespace = "gpii.ul.product.post";

    var post = fluid.registerNamespace(namespace);
    post.error = require("../../lib/error")(config);

    var express = require("../../../../node_modules/gpii-express/node_modules/express");
    post.router = express.Router();

    var bodyParser = require("../../../../node_modules/gpii-express/node_modules/body-parser");
    post.router.use(bodyParser.urlencoded());
    post.router.use(bodyParser.json());

    var postHelper = require("./post-helper")(config);

    post.router.post("/", postHelper);

    return post;
};
