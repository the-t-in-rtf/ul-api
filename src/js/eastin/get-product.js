"use strict";
var fluid = require("infusion");

// GetProduct()
// GET /eastin/product/<ID>
// Supports parameters:
//
// string productCode: the id of the product in the EASTIN partner’s system.
//
// Returns:
//
// ProductDto

// GET products/<sid>

// TODO: Figure out the best way to retrieve the Unified record (for the ISO Codes) and the
// SAI record (for the public-facing URLs).

fluid.defaults("gpii.ul.api.eastin.isoclasses", {
    gradeNames: ["gpii.express.middleware"],
    path: ":productCode"
});
