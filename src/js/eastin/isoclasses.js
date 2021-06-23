"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("gpii-express");

// GetIsoClassProductCount().
// GET /eastin/isoclasses/productcount?iso=<iso_code_value>
// params:
// - iso - A string representing the ISO Code to search for.
//
// Returns an integer representing the matching number of records.

fluid.defaults("gpii.ul.api.eastin.isoclasses.productCount.handler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.eastin.isoclasses.productCount.handler.handleRequest",
            args:     ["{that}"]
        },
        handleError: {
            func: "{that}.options.next",
            args: [{ isError: true, statusCode: 500, message: "{arguments}.0"}] // error
        },
        handleViewResponse: {
            funcName: "gpii.ul.api.eastin.isoclasses.productCount.handler.handleViewResponse",
            args: ["{that}","{arguments}.0"] // response
        }
    },
    components: {
        viewReader: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%baseUrl/_design/eastin/_view/byisocode?key=\"%key\"", { baseUrl: "{gpii.ul.api}.options.urls.ulDb" }]
                    }
                },
                termMap: {
                    "key":      "%key"
                },

                listeners: {
                    "onRead.handleViewResponse": {
                        func: "{gpii.ul.api.eastin.isoclasses.productCount.handler}.handleViewResponse",
                        args: ["{arguments}.0"] // couchResponse
                    },
                    // Report back to the user on failure.
                    "onError.sendResponse": {
                        func: "{gpii.express.handler}.sendResponse",
                        args: [ 500, { message: "{arguments}.0", url: "{that}.options.url" }] // statusCode, body
                    }
                }
            }
        }
    }
});

gpii.ul.api.eastin.isoclasses.productCount.handler.handleRequest = function (that) {
    if (that.options.request.query.iso) {
        that.viewReader.get({ key: that.options.request.query.iso });
    }
    else {
        that.options.next({ isError: true, statusCode: 400, message: "You must supply an 'iso' query variable to use this endpoint."});
    }
};

gpii.ul.api.eastin.isoclasses.productCount.handler.handleViewResponse = function (that, response) {
    var numRows = fluid.get(response, "rows.length") || 0;
    that.sendResponse(200, numRows.toString());
};

fluid.defaults("gpii.ul.api.eastin.isoclasses.productCount", {
    gradeNames: ["gpii.express.middleware.requestAware"],
    method: "get",
    path: "/productcount",
    handlerGrades: ["gpii.ul.api.eastin.isoclasses.productCount.handler"]
});

fluid.defaults("gpii.ul.api.eastin.isoclasses", {
    gradeNames: ["gpii.express.router"],
    path: "/isoclasses",
    components: {
        productCount: {
            type: "gpii.ul.api.eastin.isoclasses.productCount"
        }
    }
});
