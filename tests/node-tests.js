/* eslint-env node */
// Tests that are run using Node.  We also have tests that run using testem, see `/testem.js` for details.
//
"use strict";
// TODO: Running all of these in any order fails with an "exit code 0" and no test results.  Each combination of
// pairs I've tried seems to pass regardless of order.  Need a pairing session to help track this down.
require("./js/docs-tests");
require("./js/product");
require("./js/products-tests");
// require("./js/search-tests");
require("./js/sources-tests");
require("./js/updates-tests");
