/*

    A "launcher" that launches the website, API, along with a preconfigured gpii-pouchdb and gpii-pouchdb-lucene
    instance.  To launch this, use a command like:

    node ./launch-ul-api.js

    To launch a copy of the API that points a running CouchDB instance, use a command like:

    node ./launch-ul-api.js --optionsFile %ul-api/configs/prod.json

    For all other options, run the command with the `--help` command-line argument.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

var gpii = fluid.registerNamespace("gpii");

fluid.require("%ul-api");
fluid.require("%gpii-launcher");

fluid.defaults("gpii.ul.api.launcher", {
    gradeNames: ["gpii.launcher"],
    yargsOptions: {
        describe: {
            "cacheDir":     "The full or package-relative path to the directory in which we should store generated thumbnails of full-sized images.",
            "originalsDir": "The full or package-relative path to the directory in which full-sized images are stored.",
            "ports.api":    "The port the API should listen to.",
            "ports.couch":  "When running in production mode, the port on which CouchDB is running.  When running in dev mode, the port which PouchDB should listen to.",
            "ports.lucene": "When running in production mode, the port on which couchdb-lucene is running.  When running in dev mode, the port which gpii-pouchdb-lucene should listen to.",
            "setLogging":   "The level of log information to output to the console. Defaults to `false` (only warnings and errors)."
        },
        coerce: {
            setLogging: JSON.parse
        },
        help: true,
        defaults: {
            "optionsFile": "%ul-api/configs/dev.json"
        }
    }
});

gpii.ul.api.launcher();
