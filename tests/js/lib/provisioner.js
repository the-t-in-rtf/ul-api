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

        var promise = fluid.promise();
        promises.push(promise);
        mkdirp(destPath, function (err) {
            if (err) {
                promise.reject(err);
            }
            else {
                fluid.log("Copying test data from '", sourcePath, "' to '", destPath, "'.");
                // Copy our pregenerated test data in place
                ncp(sourcePath, destPath, function (err) {
                    if (err) {
                        promise.reject(err);
                    }
                    else {
                        promise.resolve();
                    }
                });
            }
        });
    });

    var sequence = fluid.promise.sequence(promises);
    sequence.then(that.events.onProvisioned.fire, fluid.fail);
};

gpii.tests.ul.api.provisioner.deprovision = function (that) {
    fluid.each(that.options.dataToCopy, function (destDir) {
        fluid.log("Removing test image data from '", destDir, "'...");
        rimraf(destDir, function (error) {
            if (error) {
                fluid.log("Cannot remove test image data:", error);
            }
        });
    });
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
    events: {
        onProvisioned: null
    },
    listeners: {
        "onCreate.provision": {
            funcName: "gpii.tests.ul.api.provisioner.provision",
            args:     ["{that}"]
        },
        "onDestroy.deprovision": {
            funcName: "gpii.tests.ul.api.provisioner.deprovision",
            args:     ["{that}"]
        }
    }
});
