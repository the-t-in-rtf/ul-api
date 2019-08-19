/*

    Helper functions used by the tests in this package.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.tests.ul.api");

gpii.tests.ul.api.checkResults = function (message, expected, actual, minRecords) {
    jqUnit.assertLeftHand(message, expected, actual);
    gpii.tests.ul.api.hasMinRecords(message, actual, minRecords);

    gpii.tests.ul.api.checkForCouchisms(actual.products);
};

gpii.tests.ul.api.hasMinRecords = function (message, actual, minRecords) {
    if (minRecords) {
        jqUnit.assertTrue(message + "(record count)", actual && actual.products && actual.products.length && actual.products.length >= minRecords);
    }
};

gpii.tests.ul.api.hasCouchisms = function (product) {
    if (product._id || product._rev) {
        return true;
    }

    var hasProblematicSourceRecord = false;
    fluid.each(product.sources, function (sourceRecord) {
        if (gpii.tests.ul.api.hasCouchisms(sourceRecord)) {
            hasProblematicSourceRecord = true;
        }
    });

    return hasProblematicSourceRecord;
};

gpii.tests.ul.api.checkForCouchisms = function (products) {
    var hasCouchisms = false;
    fluid.each(fluid.makeArray(products), function (product) {
        if (gpii.tests.ul.api.hasCouchisms(product)) {
            hasCouchisms = true;
        }
    });

    jqUnit.assertFalse("There should be no Couchisms in our data...", hasCouchisms);
};
