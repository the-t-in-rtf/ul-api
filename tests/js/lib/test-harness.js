// Common test harness for all Unified Listing API tests.
//
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var os    = require("os");

fluid.require("%ul-api");
fluid.require("%ul-api/src/js/harness.js");
fluid.require("%gpii-couchdb-test-harness");
gpii.test.couchdb.loadTestingSupport();

require("../lib/provisioner");

fluid.registerNamespace("gpii.tests.ul.api.harness");
gpii.tests.ul.api.harness.stopServer = function (that) {
    gpii.express.stopServer(that.express);
};

gpii.tests.ul.api.harness.getOriginalsPath = function (that) {
    return gpii.tests.ul.api.harness.getPath(that, "originals");
};

gpii.tests.ul.api.harness.getCachePath = function (that) {
    return gpii.tests.ul.api.harness.getPath(that, "cache");
};

gpii.tests.ul.api.harness.getPath = function (that, dirName) {
    var uniqueDirName = that.id + "-" + dirName;
    return gpii.ul.api.images.file.resolvePath(os.tmpdir(), uniqueDirName);
};

fluid.defaults("gpii.tests.ul.api.harness", {
    gradeNames:   ["gpii.ul.api.harness", "gpii.test.couchdb.harness"],
    setLogging:   true,
    originalsDir: "@expand:gpii.tests.ul.api.harness.getOriginalsPath({that})",
    cacheDir:     "@expand:gpii.tests.ul.api.harness.getCachePath({that})",
    components: {
        provisioner: {
            type: "gpii.tests.ul.api.provisioner",
            options: {
                originalsDir: "{harness}.options.originalsDir",
                cacheDir:     "{harness}.options.cacheDir"
            }
        }
    }
});
