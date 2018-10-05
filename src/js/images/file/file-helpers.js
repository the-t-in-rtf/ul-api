// Static functions to assist in resolving paths and other common tasks.
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var path = require("path");

fluid.registerNamespace("gpii.ul.api.images.file");

/**
 *
 * Resolve a full path from a group of segments.
 *
 * @param {String} baseDir - A full or package-relative path to the base directory.
 * @param {String|Array} segments - One or more path segments, that will be resolved in order using `path.resolve`
 *
 * @return {String} A string representing the full resolved path.
 */
gpii.ul.api.images.file.resolvePath = function (baseDir, segments) {
    var resolvedPath = fluid.module.resolvePath(baseDir);
    fluid.each(fluid.makeArray(segments), function (segment) {
        resolvedPath = path.resolve(resolvedPath, segment);
    });
    return resolvedPath;
};
