/*

    A client-side component that renders and binds a panel of checkboxes defined in `options.checkboxes` to
    the `checkboxValue` model variable.

    `options.checkboxes` is a map that should look something like:

    ```
     checkboxes: {
         string: {
             label: "String",
             value: "a string value"
         },
         number: {
             label: "Number",
             value: 12345
         },
         boolean: {
             label: "Boolean",
             value: false
         },
         array: {
             label: "Array",
             value: ["eggs", "milk", "bread"]
         },
         object: {
             label: "Object",
             value: { lights: "off", tv: "on" }
         }
     },
    ```

    If you want to add verbiage near the panel, you can create your own template for use in
    `options.template`, and then call the default template as a partial, as in:

    ```
    <h1>My really important additional HTML</h1>

    {{>common-checkboxPanel}}
    ```

    This grade extends `gpii.handlebars.templateAware`.  The most important of the options used by that grade is
    `options.selectors.initial`, which is the container in which our content will be rendered.  This is set to `""`
     by default, i.e. content will be rendered into the whole container.

    The relay of data between a checkbox and an associated model variable is handled using `gpii-binder`.  By default,
    all form variables are expected to be strings.  If you wish to change this behavior, you will need to change
    your component's `binding` option to transform each value as it is relayed.  As checkbox panels always consist
    of arrays, you will need to use the `transformArray` function provided by this package, as in:


    ```
    rules: {
        domToModel: {
            "": {
                transform: {
                    type: "gpii.ul.transforms.transformArray",
                    inputPath: "",
                    rules: {
                        "": {
                            transform: {
                                type: "fluid.transforms.stringToNumber",
                                inputPath: ""
                            }
                        }
                    }
                }
            }
        },
        modelToDom: {
            "": {
                transform: {
                    type: "gpii.ul.transforms.transformArray",
                    inputPath: "",
                    rules: {
                        "": {
                            transform: {
                                type: "fluid.transforms.numberToString",
                                inputPath: ""
                            }
                        }
                    }
                }
            }
        }
    }
    ```

    The above example taken from the tests in this package ensures that number values (such as those used in an "items
    per page" control) are relayed correctly.

    In the above example, all data in a checkbox panel is transformed using the same rules.  There is currently no
    mechanism for handling multiple data types in a single checkbox panel.  As we can simply use the `toString` function
    to convert model variables to form elements, the other part of the binding is omitted.  If you need to work with
    data that does not provide meaningful output via a `toString` function, please check out at the `gpii-binder`
    documentation.

    TODO:  Make these into real docs once we move it into another package.
 */
// TODO:  Discuss where this should live.  I propose moving "bound" components like this that also use templates to `gpii-handlebars`.
/* global fluid */
(function () {
    "use strict";
    fluid.defaults("gpii.ul.checkboxPanel", {
        gradeNames: ["gpii.handlebars.templateAware.serverAware"],
        template: "common-checkboxPanel",
        selectors: {
            initial:         "",
            checkboxOptions: "input[name='checkbox-option']"
        },
        bindings: {
            checkboxes: {
                selector: "checkboxOptions",
                path:     "checkboxValue"
            }
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["initial", "{that}.options.template", {id: "{that}.id", checkboxes: "{that}.options.checkboxes"}]
            }
        }
    });
})();
