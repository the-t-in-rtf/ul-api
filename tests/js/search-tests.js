/* eslint-env node */
// tests for all read methods
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../");
gpii.ul.api.loadTestingSupport();

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.tests.ul.api.search");

gpii.tests.ul.api.search.hasSearchResults = function (body, maxResults) {
    jqUnit.assertTrue("There should be at least one result.", body.products && body.products.length > 0);

    if (maxResults) {
        jqUnit.assertTrue("There should be no more than " + maxResults + " products returned.", body.products.length <= maxResults);
    }

    gpii.tests.ul.api.checkForCouchisms(body.products);
};

gpii.tests.ul.api.search.hasNoSearchResults = function (body) {
    jqUnit.assertTrue("There should be no search results.", body.products && body.products.length === 0);
};

// Confirm whether the first record contains any source data.  Used to check permissions by source.
gpii.tests.ul.api.search.checkSourceRecords = function (body, shouldHaveSourceData) {
    if (shouldHaveSourceData) {
        jqUnit.assertTrue("There should be source data.", fluid.get(body, "products.0.sources.length") > 0);
    }
    else {
        jqUnit.assertTrue("There should not be any source data.", fluid.get(body, "products.0.sources.length") === 0);
    }
};

gpii.tests.ul.api.search.checkSpecificRecord = function (body, recordNumber, expected) {
    var record = body.products[recordNumber];
    jqUnit.assertLeftHand("The record should match what we expect.", expected, record);
};

gpii.tests.ul.api.search.checkDataLimitedResults = function (body) {
    jqUnit.assertEquals("There should only be one record.", 1, fluid.get(body, "products.length"));
    jqUnit.assertLeftHand("The record returned should be as expected.", { name: "A record ahead of its time."}, fluid.get(body, "products.0"));
};

fluid.defaults("gpii.tests.ul.api.search.caseHolder", {
    gradeNames: ["gpii.test.ul.api.caseHolder"],
    rawModules: [
        {
            name: "Testing GET /api/search and GET /api/suggest.",
            tests: [
                {
                    name: "Confirm that a search with only a simple query works.",
                    type: "test",
                    sequence: [
                        {
                            func: "{basicSearch}.send",
                            args: []
                        },
                        {
                            event:    "{basicSearch}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.hasSearchResults",
                            args:     ["@expand:JSON.parse({arguments}.0)"] // body, maxResults
                        }
                    ]
                },
                {
                    name: "Confirm that source records are based on the logged in user.",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousSearch}.send",
                            args: []
                        },
                        {
                            event:    "{anonymousSearch}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.checkSourceRecords",
                            args:     ["@expand:JSON.parse({arguments}.0)"] //  body, shouldHaveSourceData
                        },
                        {
                            func: "{loginRequest}.send",
                            args: [{ username: "existing", password: "password"}]
                        },
                        {
                            event:    "{loginRequest}.events.onComplete",
                            listener: "{loggedInSearch}.send",
                            args:     []
                        },
                        {
                            event:    "{loggedInSearch}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.checkSourceRecords",
                            args:     ["@expand:JSON.parse({arguments}.0)", true] //  body, shouldHaveSourceData
                        }
                    ]
                },
                {
                    name: "Confirm that using a record limit works.",
                    type: "test",
                    sequence: [
                        {
                            func: "{limitedRequest}.send",
                            args: []
                        },
                        {
                            event:    "{limitedRequest}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.checkSpecificRecord",
                            args:     ["@expand:JSON.parse({arguments}.0)", 42, { "name": "Whetstone 042" }] // body, recordNumber, expected
                        }
                    ]
                },
                {
                    name: "Confirm that using an offset works.",
                    type: "test",
                    sequence: [
                        {
                            func: "{offsetRequest}.send",
                            args: []
                        },
                        {
                            event:    "{offsetRequest}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.checkSpecificRecord",
                            args:     ["@expand:JSON.parse({arguments}.0)", 0, { "name": "Whetstone 499" }] // body, recordNumber, expected
                        }
                    ]
                },
                {
                    name: "Confirm that using both an offset and limit works.",
                    type: "test",
                    sequence: [
                        {
                            func: "{limitedAndOffsetRequest}.send",
                            args: []
                        },
                        {
                            event:    "{limitedAndOffsetRequest}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.checkSpecificRecord",
                            args:     ["@expand:JSON.parse({arguments}.0)", 1, { "name": "Whetstone 042" }] // body, recordNumber, expected
                        }
                    ]
                },
                {
                    name: "Confirm that deleted records do not appear by default.",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchForDeleted}.send",
                            args: []
                        },
                        {
                            event:    "{searchForDeleted}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.hasNoSearchResults",
                            args:     ["@expand:JSON.parse({arguments}.0)"] // body
                        }
                    ]
                },
                {
                    name: "Confirm that deleted records appear when the right status string is sent.",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchForDeletedWithStatusString}.send",
                            args: []
                        },
                        {
                            event:    "{searchForDeletedWithStatusString}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.checkSpecificRecord",
                            args:     ["@expand:JSON.parse({arguments}.0)", 0, { "name": "Deleted record" }] // body, recordNumber, expected
                        }
                    ]
                },
                {
                    name: "Confirm that deleted records appear when an array of status strings is sent.",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchForDeletedWithStatusArray}.send",
                            args: []
                        },
                        {
                            event:    "{searchForDeletedWithStatusArray}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.checkSpecificRecord",
                            args:     ["@expand:JSON.parse({arguments}.0)", 0, { "name": "Deleted record" }] // body, recordNumber, expected
                        }
                    ]
                },
                {
                    name: "Confirm that we can limit results by date.",
                    type: "test",
                    sequence: [
                        {
                            func: "{dateLimitedSearch}.send",
                            args: []
                        },
                        {
                            event: "{dateLimitedSearch}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.checkDataLimitedResults",
                            args: ["@expand:JSON.parse({arguments}.0)"]
                        }
                    ]
                },
                {
                    name: "Confirm that an invalid search request receives an appropriate response.",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidSearch}.send",
                            args: []
                        },
                        {
                            event:    "{invalidSearch}.events.onComplete",
                            listener: "jqUnit.assertLeftHand",
                            args:     ["An search with invalid query parameters should not be succesful.", { isValid: false, statusCode: 400 }, "@expand:JSON.parse({arguments}.0)"]
                        }
                    ]
                },
                {
                    name: "Confirm that the `suggest` simplified search works.",
                    type: "test",
                    sequence: [
                        {
                            func: "{basicSuggestions}.send",
                            args: []
                        },
                        // There should be only a handful of results
                        {
                            event:    "{basicSuggestions}.events.onComplete",
                            listener: "gpii.tests.ul.api.search.hasSearchResults",
                            args:     ["@expand:JSON.parse({arguments}.0)", 5] // body, maxResults
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        },
        basicSearch: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22jaws%22"
            }
        },
        anonymousSearch: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22sample%22"
            }
        },
        loginRequest: {
            type: "gpii.test.ul.api.request.login"
        },
        loggedInSearch: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22sample%22"
            }
        },
        basicSuggestions: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/suggest?q=%22whetstone%22"
            }
        },
        limitedRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22whetstone%22&limit=43&sortBy=%22name%22"
            }
        },
        offsetRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22whetstone%22&offset=499&sortBy=%22name%22"
            }
        },
        limitedAndOffsetRequest: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22whetstone%22&offset=41&limit=2&sortBy=%22name%22"
            }
        },
        searchForDeleted: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22deleted%22&statuses=%22new%22"
            }
        },
        searchForDeletedWithStatusString: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22deleted%22&statuses=[%22deleted%22]"
            }
        },
        searchForDeletedWithStatusArray: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22deleted%22&statuses=%5B%22deleted%22%5D"
            }
        },
        dateLimitedSearch: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search?q=%22record%22&updatedSince=%222525-01-01%22"
            }
        },
        invalidSearch: {
            type: "gpii.test.ul.api.request",
            options: {
                endpoint: "api/search"
            }
        }
    }
});


fluid.defaults("gpii.tests.ul.api.search.environment", {
    gradeNames: ["gpii.test.ul.api.testEnvironment"],
    ports: {
        api: 9753
    },
    components: {
        testCaseHolder: {
            type: "gpii.tests.ul.api.search.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.search.environment");
