// Unofficial API to pull the list of sources the user is allowed to see.  Used only to populate controls in the
// "updates" report.
//
// Users are allowed to see:
//
// 1. Any sources whose visibility options include the special role `*`.
// 2. Any sources whose visibility options include one of their roles.
// 3. A source that exactly matches their own user ID (used for contributions).
//
// TODO:  Ensure that no one can create a user whose username matches a key in sources.json
// TODO:  Ensure that everyone's "personal" source is visible to them.

/* eslint-env node */
"use strict";
var fluid = fluid || require("infusion");
var gpii = fluid.registerNamespace("gpii");

var fs   = require("fs");
var path = require("path");

require("gpii-express");

fluid.registerNamespace("gpii.ul.api.sources");
gpii.ul.api.sources.sources = JSON.parse(fs.readFileSync(path.resolve(__dirname, "sources.json"), { encoding: "utf8"}));

fluid.registerNamespace("gpii.ul.api.sources.request");
gpii.ul.api.sources.request.handleRequest = function (that) {

    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];
    var visibleSources = gpii.ul.api.sources.request.listReadableSources(that.options.sources, user);

    that.sendResponse(200, { sources: visibleSources });
};

gpii.ul.api.sources.request.listReadableSources = function (sources, user) {
    return gpii.ul.api.sources.request.listSources(sources, user, "view")
};

gpii.ul.api.sources.request.listWritableSources = function (sources, user) {
    return gpii.ul.api.sources.request.listSources(sources, user, "edit")
};

gpii.ul.api.sources.request.listSources = function (sources, user, permission) {
    var visibleSources = [];

    fluid.each(sources, function (sourceOptions, source) {
        // The special character `~` applies to the current username.  If it is found in the list of sources and the user
        // is logged in, they are given permission to add products whose source matches their username.  This is used to
        // power the "contribute" functionality for both manufacturer and general users.
        //
        if (source === "~" && user) {
            visibleSources.push(user.username);
        }
        else {
            var hasPermission = false;

            // Some sources (like the unified source) are visible to everyone. These have a virtual "wildcard" role (*).
            if (sourceOptions[permission] && sourceOptions[permission].indexOf("*") !== -1) {
                hasPermission = true;
            }
            // Everything else is based on the user's roles.
            else if (!hasPermission && user && user.roles) {
                fluid.each(sourceOptions[permission], function (role) {
                    if (!hasPermission && user.roles.indexOf(role) !== -1) {
                        hasPermission = true;
                    }
                });
            }

            if (hasPermission) {
                visibleSources.push(source);
            }
        }
    });

    return visibleSources;
};

fluid.defaults("gpii.ul.api.sources.request", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.sources.request.handleRequest",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.ul.api.sources.router", {
    gradeNames:    ["gpii.express.middleware.requestAware"],
    path:          "/sources",
    handlerGrades: ["gpii.ul.api.sources.request"],
    sources:       gpii.ul.api.sources.sources,
    distributeOptions: {
        source: "{that}.options.sources",
        target: "{that gpii.express.handler}.options.sources"
    }
});

