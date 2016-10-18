/* eslint-env node */
// Tests that are run using Node.  We also have tests that run using testem, see `/testem.js` for details.
//
"use strict";

// TODO:  Review this with Antranig.  From the coverage reports, it looks like the tests are running, but no test output is displayed.
require("./js/docs-tests");
require("./js/product");
require("./js/products-tests");
require("./js/search-tests");
require("./js/sources-tests");
require("./js/updates-tests");
