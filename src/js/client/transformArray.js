/* globals fluid */
/*

    A Model transformation function to transform each element in an array.  Used with the "checkbox" panel.

 */
// TODO:  Discuss whether this should be moved into Fluid.
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.ul.transforms");

    gpii.ul.transforms.transformArray = function (value, transformSpec) {
        var valueArray = fluid.makeArray(value);
        var returnArray = [];

        fluid.each(valueArray, function (singleValue) {
            returnArray.push(fluid.model.transformWithRules(singleValue, transformSpec.rules))
        });

        return returnArray;
    };

    fluid.defaults("gpii.ul.transforms.transformArray", {
        gradeNames: ["fluid.standardTransformFunction"]
    });
})();
