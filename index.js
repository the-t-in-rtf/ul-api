"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./src/js/api/index");

fluid.module.register("ul-api", __dirname, require);

// Provide a function to optionally load test support.
fluid.registerNamespace("gpii.ul.api");
gpii.ul.api.loadTestingSupport = function () {
    require("./tests/js/lib/fixtures");
    require("./tests/js/lib/test-harness");
};

module.exports = gpii.ul.api;