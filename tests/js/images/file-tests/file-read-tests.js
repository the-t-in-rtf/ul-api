/*

    Tests for the following API endpoints:

    * `GET /api/images/file/:uid/:source/:image_id`
    * `GET /api/images/file/:uid/:source/:width/:image_id`
    * `HEAD /api/images/file/:uid/:source/:image_id`
    * `HEAD /api/images/file/:uid/:source/:width/:image_id`

*/
"use strict";
var fluid = require("infusion");
fluid.loadTestingSupport();

require("node-jqunit");

require("../../lib/request");
require("../../lib/common-sequences");

fluid.defaults("gpii.tests.ul.api.images.file.elements.loadUnifiedOriginal", {
    gradeNames: ["gpii.tests.ul.api.images.elements.loadAndCheck"],
    endpoint: "/api/images/file/1421059432806-826608318/unified/a.svg",
    expectedResponseStatus: 200,
    expectedResponseBody: {}
});

/*

    TODO: Write tests for the following:

    1.  Load a "unified" original without logging in.
    2.  Load the same file at another size, which has already been cached.
    3.  Load the same file at a new size, which has not been cached.
    4.  Make a HEAD request for the same file at a new size.  Make a second HEAD request and confirm the eTags are the same.
    5.  Access an original from a restricted source without logging in.
    6.  Make a HEAD request for an original from a restricted source without logging in.
    7.  Access an original from a restricted source while logged in.
    8.  Make a HEAD request for an original from a restricted source while logged in.
    9.  Attempt to load a resized version of a restricted image without logging in.
    10. Attempt to load a resized version of a restricted image while logged in.
    11. Attempt to load an original image that does not exist.
    12. Attempt to load a resized version of an original image that does not exist.
    13. Make a HEAD request for an image that does not exist.

 */

fluid.defaults("gpii.tests.ul.api.images.file.sequences.anonymous.loadUnifiedOriginal", {
    // TODO:  Talk with Antranig about distributing cookie jar to elements.
    // gradeNames: ["gpii.tests.ul.api.images.sequences.standardStartupAndShutdown", "gpii.tests.ul.api.images.hasCookieJar"],
    gradeNames: ["gpii.tests.ul.api.images.sequences.standardStartupAndShutdown"],
    sequenceElements: {
        loadUnifiedOriginal: {
            gradeNames: "gpii.tests.ul.api.images.file.elements.loadUnifiedOriginal",
            priority:   "after:startup"
        }
    }
});

fluid.defaults("gpii.tests.ul.api.images.file.read.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [
        {
            name: "UL Image API 'read' tests for /api/images/file...",
            tests: [{
                name: "Load a unified original file anonymously...",
                sequenceGrade: "gpii.tests.ul.api.images.file.sequences.anonymous.loadUnifiedOriginal",
                sequence: [{
                    func: "fluid.identity"
                }]
            }]
        }
    ]
});

fluid.defaults("gpii.tests.ul.api.images.file.read.environment", {
    gradeNames: ["fluid.test.testEnvironment", "gpii.tests.ul.api.images.harness"],
    components: {
        caseHolder: {
            type: "gpii.tests.ul.api.images.file.read.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.ul.api.images.file.read.environment");
