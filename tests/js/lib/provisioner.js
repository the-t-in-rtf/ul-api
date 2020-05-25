// A script to provision the filesystem used with GET /api/images/file based on our test data
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var ncp    = require("ncp");

fluid.registerNamespace("gpii.tests.ul.api.provisioner");
gpii.tests.ul.api.provisioner.provision = function (that) {
    var promises = [];

    fluid.each(that.options.dataToCopy, function (destDir, sourceDir) {
        var sourcePath = fluid.module.resolvePath(that.options[sourceDir]);
        var destPath   = fluid.module.resolvePath(that.options[destDir]);

        var wrappedPromise = fluid.promise();
        promises.push(wrappedPromise);
        var mkdirRawPromise = mkdirp(destPath);
        mkdirRawPromise.then(wrappedPromise.resolve, function (err) {
            if (err) {
                wrappedPromise.reject(err);
            }
            else {
                fluid.log("Copying test data from '", sourcePath, "' to '", destPath, "'.");
                // Copy our pregenerated test data in place
                ncp(sourcePath, destPath, function (err) {
                    if (err) {
                        wrappedPromise.reject(err);
                    }
                    else {
                        wrappedPromise.resolve();
                    }
                });
            }
        });
    });

    var sequence = fluid.promise.sequence(promises);
    return sequence;
};

gpii.tests.ul.api.provisioner.cleanup = function (that) {
    var cleanupPromises = [];
    fluid.each(that.options.dataToCopy, function (destDir) {
        var cleanupPromise = fluid.promise();
        fluid.log("Removing test image data from '", destDir, "'...");
        rimraf(destDir, function (error) {
            if (error) {
                cleanupPromise.reject(fluid.get(error, "message.js") || error);
                fluid.log("Cannot remove test image data:", error);
            }
            cleanupPromise.resolve();
        });
        cleanupPromises.push(cleanupPromise);
    });
    return fluid.promise.sequence(cleanupPromises);
};

fluid.defaults("gpii.tests.ul.api.provisioner", {
    gradeNames: ["fluid.component", "gpii.hasRequiredOptions"],
    dataToCopy: {
        // "source.path": "target.path"
        "testDataDir": "originalsDir",
        "testCacheDir": "cacheDir"
    },
    requiredFields: {
        "testDataDir": true,  // Where our test data is located.
        "testCacheDir": true,  // Where our test data is located.
        "originalsDir": true, // Where to store the originals.
        "cacheDir":     true  // Where to store resized images.
    },
    testCacheDir: "%ul-api/tests/images/cache",
    testDataDir: "%ul-api/tests/images/originals",
    invokers: {
        "provision": {
            funcName: "gpii.tests.ul.api.provisioner.provision",
            args:     ["{that}"]
        },
        "cleanup": {
            funcName: "gpii.tests.ul.api.provisioner.cleanup",
            args:     ["{that}"]
        }
    }
});
