/*

    GET /api/sources, returns the list of sources the user is allowed to see.  Used to populate controls in the
    "updates" report.

    Users are allowed to see:

    1. Any sources whose visibility options include the special role `*`.
    2. Any sources whose visibility options include one of their roles.
    3. A source that exactly matches a tilde followed by their own user ID (used for contributions).

    Some of the static functions defined here are also used in /api/products and /api/product, to confirm that the user
    is allowed to view one or more records from a particular source.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var fs    = require("fs");
var path  = require("path");

require("gpii-express");

fluid.registerNamespace("gpii.ul.api.sources");
gpii.ul.api.sources.sources = JSON.parse(fs.readFileSync(path.resolve(__dirname, "sources.json"), { encoding: "utf8"}));

fluid.registerNamespace("gpii.ul.api.sources.request");

/**
 *
 * Handle a single incoming request.  Compares the current user to the full list of sources and returns those for which
 * the user has permission.  Used in the "updates" interface.
 *
 * Fulfills the standard contract for a `gpii.express.handler` instance:
 * https://github.com/GPII/gpii-express/blob/master/docs/handler.md
 *
 * @param {Object} that - The component itself.
 *
 */
gpii.ul.api.sources.request.handleRequest = function (that) {

    var user = that.options.request.session && that.options.request.session[that.options.sessionKey];

    var readSources = gpii.ul.api.sources.request.listReadableSources(that.options.sources, user);
    readSources.sort();

    var writableSources = gpii.ul.api.sources.request.listWritableSources(that.options.sources, user);
    writableSources.sort();

    that.sendResponse(200, { sources: readSources, writableSources: writableSources });
};

/**
 *
 * A static function to filter a list of source definitions and return only those the current user can "view".
 *
 * @param {Object} sources - A map of source definitions, keyed by name.
 * @param {Object} user - The current object, as stored in the request session by gpii-express-user.
 * @return {Array} An array of sources the current user can "view".
 *
 */
gpii.ul.api.sources.request.listReadableSources = function (sources, user) {
    return gpii.ul.api.sources.request.listSources(sources, user, "view");
};

/**
 *
 * A static function to filter a list of source definitions and return only those the current user can "edit".
 *
 * @param {Object} sources - A map of source definitions, keyed by name.
 * @param {Object} user - The current object, as stored in the request session by gpii-express-user.
 * @return {Array} An array of sources the current user can "edit".
 *
 */
gpii.ul.api.sources.request.listWritableSources = function (sources, user) {
    return gpii.ul.api.sources.request.listSources(sources, user, "edit");
};

/**
 *
 * A static function to filter a list of source definitions down to those for which the current user has a specified permission.
 *
 * @param {Object} sources - A map of source definitions, keyed by name.
 * @param {Object} user - The current object, as stored in the request session by gpii-express-user.
 * @param {String} permission - The permission to look for, either "view" or "edit".
 * @return {Array} An array of sources for which the current user has the selected permission.
 *
 */
gpii.ul.api.sources.request.listSources = function (sources, user, permission) {
    var sourcesWithPermission = [];

    fluid.each(sources, function (sourceOptions, source) {
        // The special character `~` applies to the current username.  If it is found in the list of sources and the user
        // is logged in, they are given permission to add products whose source matches their username.  This is used to
        // power the "contribute" functionality for both manufacturer and general users.
        //
        if (source === "~" && user) {
            sourcesWithPermission.push("~" + user.username);
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
                sourcesWithPermission.push(source);
            }
        }
    });

    return sourcesWithPermission;
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

fluid.defaults("gpii.ul.api.sources", {
    gradeNames:    ["gpii.express.middleware.requestAware"],
    path:          "/sources",
    handlerGrades: ["gpii.ul.api.sources.request"],
    sources:       gpii.ul.api.sources.sources,
    distributeOptions: {
        source: "{that}.options.sources",
        target: "{that gpii.express.handler}.options.sources"
    }
});
