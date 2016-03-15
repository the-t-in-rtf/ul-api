"use strict";
var fluid = require("infusion");

require("./src/js/api/index");

fluid.module.register("ul-api", __dirname, require);
