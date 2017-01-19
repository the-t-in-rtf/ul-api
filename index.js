/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./src/js/");

fluid.module.register("ul-api", __dirname, require);

// Provide a function to optionally load test support.
fluid.registerNamespace("gpii.ul.api");
gpii.ul.api.loadTestingSupport = function () {
    require("./tests/js/lib/");
};

module.exports = gpii.ul.api;
