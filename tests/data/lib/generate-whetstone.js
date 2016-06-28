/* eslint-env node */
"use strict";
var fs = require("fs");

var docs = [];

for (var a = 0; a < 500; a++) {
    docs.push({
        "description": "A 'whetstone' record for use in testing our multi-request strategy for larger record sets.",
        "manufacturer": {
            "name": "Acme, Inc."
        },
        "name": "Whetstone " + a,
        "uid": "whetstone-" + a,
        "sid": "whetstone-" + a,
        "source": "unified",
        "status": "new",
        "updated": (new Date()).toISOString()
    });
}

fs.writeFileSync("whetstone.json", JSON.stringify({ docs: docs }, null, 2), "utf8");
