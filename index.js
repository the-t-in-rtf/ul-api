/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./src/js/api/index");

fluid.module.register("gpii-ul-api", __dirname, require);

// Provide a function to optionally load test support.
fluid.registerNamespace("gpii.ul.api");
gpii.ul.api.loadTestingSupport = function () {
    require("./tests/js/lib/fixtures");
};

module.exports = gpii.ul.api;
