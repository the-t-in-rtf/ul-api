// A generic component that controls and updates a single drop-down field based on a single model variable.
/* global fluid */
(function () {
    "use strict";
    fluid.defaults("gpii.ul.select", {
        gradeNames: ["gpii.handlebars.templateAware"],
        selectors:  {
            initial: ""
        },
        bindings: {
            select:  "select"
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["initial", "{that}.options.template", "{that}.options.select"]
            }
        },
        modelListeners: {
            select: {
                func:          "{that}.renderInitialMarkup",
                excludeSource: "init"
            }
        }
    });
})();
