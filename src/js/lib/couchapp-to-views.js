// TODO: Mention this to other couchapp users within the community if it proves at all useful.
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var fs   = require("fs");
var path = require("path");

// Required to be able to resolve our paths.
fluid.require("%ul-api");

fluid.defaults("gpii.ul.api.couchapp.converter", {
    gradeNames: ["fluid.component"],
    toConvert: {
        lucene:  "%ul-api/src/couchapp/lucene",
        reports: "%ul-api/src/couchapp/reports",
        ul:      "%ul-api/src/couchapp/ul",
        eastin:  "%ul-api/src/couchapp/eastin"
    },
    outputFile: "%ul-api/tests/data/views.json",
    listeners: {
        "onCreate.convertToViews": {
            funcName: "gpii.ul.api.couchapp.converter.convertToViews"
        }
    }
});

gpii.ul.api.couchapp.converter.convertToViews = function (that) {
    var allViews = {
        docs: []
    };

    fluid.each(that.options.toConvert, function (singleViewDirPath) {
        var resolvedViewDir = fluid.module.resolvePath(singleViewDirPath);

        var idFilePath = path.resolve(resolvedViewDir, "_id");
        if (fs.existsSync(idFilePath)) {
            var singleViewDef = gpii.ul.api.couchapp.converter.readSingleDir(resolvedViewDir);
            singleViewDef.language = "javascript";

            var _id = fs.readFileSync(idFilePath, { encoding: "utf8"});
            singleViewDef._id = _id;

            allViews.docs.push(singleViewDef);
        }
    });

    var outputPath = fluid.module.resolvePath(that.options.outputFile);
    // Generate this following the linting conventions of manually-created files.
    var JSONAsString = JSON.stringify(allViews, null, 4) + "\n";
    fs.writeFileSync(outputPath, JSONAsString, { encoding: "utf8"});
};

gpii.ul.api.couchapp.converter.readSingleDir = function (startingPath) {
    var levelContent = {};
    var dirFiles = fs.readdirSync(startingPath, { encoding: "utf8"});
    fluid.each(dirFiles, function (singleFilename) {
        var subPath = path.resolve(startingPath, singleFilename);
        var fileStats = fs.statSync(subPath);
        // Convert all subdirectories into nested entries under this one.
        if (fileStats.isDirectory()) {
            var subDirContent = gpii.ul.api.couchapp.converter.readSingleDir(subPath);
            levelContent[singleFilename] = subDirContent;
        }
        // Handle javascript files at this level.
        else if (fileStats.isFile()) {
            var matches = singleFilename.match(/(.+)\.(js.*)/);
            if (matches) {
                var fileKey = matches[1];
                var fileContent = fs.readFileSync(subPath, { encoding: "utf8"});
                if (matches[2] === "js") {
                    levelContent[fileKey] = fileContent;
                }
                else if (matches[2] === "json") {
                    levelContent[fileKey] = JSON.parse(fileContent);
                }
            }
        }
    });
    return levelContent;
};

gpii.ul.api.couchapp.converter();
