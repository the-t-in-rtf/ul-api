// Basic search component for the Unified Listing
/* global fluid */
"use strict";
(function () {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.ul.search.query");

    gpii.ul.search.query.refreshOnUpdateIfHasQuery = function (that) {
        if (that.model.q) {
            that.applier.change("offset", 0);
            gpii.ul.search.query.refreshIfHasQuery(that);
        }
    };

    gpii.ul.search.query.refreshIfHasQuery = function (that) {
        if (that.model.q) {
            that.submitForm();
        }
    };

    gpii.ul.search.query.filterAndEncode = function (payload) {
        var filtered = fluid.filterKeys(payload, ["q", "sources", "statuses", "sortBy", "offset", "limit", "unified", "includeSources"]);
        return gpii.express.querystring.encodeObject(filtered);
    };

    fluid.defaults("gpii.ul.search.query.filterAndEncode", {
        gradeNames: ["fluid.standardTransformFunction"]
    });

    fluid.defaults("gpii.ul.search.query", {
        gradeNames: ["gpii.handlebars.templateFormControl"],
        ajaxOptions: {
            url:      "/api/search",
            method:   "GET",
            dataType: "json"
        },
        hideOnSuccess: false,
        hideOnError:   false,
        rules: {
            successResponseToModel: {
                "":           "notfound",
                products:     "responseJSON.products", // The "products" component will handle displaying products.
                totalRows:    "responseJSON.total_rows",
                errorMessage: { literalValue: null }
            },
            errorResponseToModel: {
                successMessage: { literalValue: null }
            },
            modelToRequestPayload: {
                "": {
                    transform: {
                        type: "gpii.ul.search.query.filterAndEncode",
                        inputPath: ""
                    }
                }
            }
        },
        selectors: {
            initial: "",
            form:    ".search-query-form",
            success: ".search-query-success",
            error:   ".search-query-error",
            q:       ".search-query-string",
            submit:  ".search-query-submit"
        },
        templates: {
            initial: "search-query",
            success: "common-success",
            error:   "common-error"
        },
        bindings: {
            q: "q"
        },
        invokers: {
            submitForm: {
                funcName: "gpii.handlebars.templateFormControl.submitForm",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        modelListeners: {
            q: {
                funcName:      "gpii.ul.search.query.refreshOnUpdateIfHasQuery",
                excludeSource: "init",
                args:          ["{that}"]
            },
            sortBy: {
                funcName:      "gpii.ul.search.query.refreshOnUpdateIfHasQuery",
                excludeSource: "init",
                args:          ["{that}"]
            },
            statuses: {
                funcName:      "gpii.ul.search.query.refreshOnUpdateIfHasQuery",
                excludeSource: "init",
                args:          ["{that}"]
            },
            limit: {
                funcName:      "gpii.ul.search.query.refreshOnUpdateIfHasQuery",
                excludeSource: "init",
                args:          ["{that}"]
            }
        },
        listeners: {
            "onCreate.fireIfReady": {
                funcName:      "gpii.ul.search.query.refreshIfHasQuery",
                args:          ["{that}"]
            }
        }
    });

    fluid.registerNamespace("gpii.ul.search.products");

    // TODO:  Replace this with a common paging component
    // Return `limit` products from `array`, starting at `offset`
    gpii.ul.search.products.pageResults = function (array, offset, limit) {
        if (!array) { return; }

        // Set sensible defaults if we are not passed anything.
        var start = offset ? offset : 0;
        var end   = limit ? start + limit : array.length - offset;
        return array.slice(start, end);
    };

    gpii.ul.search.products.pageAndRender = function (that) {
        that.model.pagedProducts = gpii.ul.search.products.pageResults(that.model.products, that.model.offset, that.model.limit);
        that.renderInitialMarkup();
    };


    fluid.defaults("gpii.ul.search.products", {
        gradeNames: ["gpii.handlebars.templateAware"],
        model: {
            products:  []
        },
        selectors: {
            results: ""
        },
        template: "search-products",
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["results", "{that}.options.template", "{that}.model"]
            },
            pageAndRender: {
                funcName: "gpii.ul.search.products.pageAndRender",
                args:     ["{that}"]
            }
        },
        modelListeners: {
            products: {
                func:          "{that}.pageAndRender",
                excludeSource: "init"
            },
            offset: {
                func:          "{that}.pageAndRender",
                excludeSource: "init"
            },
            limit: {
                func:          "{that}.pageAndRender",
                excludeSource: "init"
            }
        }
    });

    // The "sortBy" control that updates the sortBy values based on a predefined list of possible settings.
    fluid.defaults("gpii.ul.search.sortBy", {
        gradeNames: ["gpii.ul.select"],
        template:   "search-sortBy",
        selectors:  {
            initial: "",
            select:  ".search-sortBy-select"
        },
        select: {
            options: {
                nameAsc: {
                    label: "by name, A-Z",
                    value: "/name"
                },
                nameDesc: {
                    label: "by name, Z-A",
                    value: "\name"
                }
            }
        }
    });

    // The "statuses" control that updates the status values based on a predefined list of possible settings.
    fluid.defaults("gpii.ul.search.statuses", {
        gradeNames: ["gpii.ul.statuses"],
        selectors:  {
            select:  ".search-statuses-option"
        }
    });

    // The "limit" control that updates the number of products per page based on a predefined list of possible settings.
    fluid.defaults("gpii.ul.search.limit", {
        gradeNames: ["gpii.ul.select"],
        template:   "search-limit",
        selectors:  {
            initial: "",
            select:  ".search-limit-select"
        },
        select: {
            options: {
                twentyFive: {
                    label: "25 products per page",
                    value: "25"
                },
                fifty: {
                    label: "50 products per page",
                    value: "50"
                },
                hundred: {
                    label: "100 products per page",
                    value: "100"

                }
            }
        }
    });

    // The wrapper component that wires together all controls.
    fluid.defaults("gpii.ul.search", {
        gradeNames: ["gpii.handlebars.templateAware"],
        model: {
            q:         "",
            sources:    [],
            statuses:    [ "new", "active", "discontinued"],
            sortBy:      "/name",
            offset:    0,
            limit:     25,
            totalRows: 0,
            unified:   true,
            includeSources:   true,
            products:   []
        },
        components: {
            // TODO:  Wire in the new location bar relay.
            // Sync our search settings with the queryString and history, so that bookmarking and back/forward buttons
            // work as expected.  Must be a child of query so that it is created at the right time to take
            // advantage of its bindings.
            locationBar: {
                type:          "gpii.locationBar.syncAll",
                options: {
                    events: {
                        onReady: {
                            events: {
                                queryDataLoaded:  "queryDataLoaded",
                                onMarkupRendered: "{search}.events.onMarkupRendered"
                            }
                        }
                    }
                    // TODO:  Add detailed tests to prevent this component from blowing away the existing model data.
                    //model: {
                    //    offset:  "{search}.model.offset",
                    //    limit:   "{search}.model.limit",
                    //    q:       "{search}.model.q",
                    //    sortBy:    "{search}.model.sortBy",
                    //    sources:  "{search}.model.sources",
                    //    statuses:  "{search}.model.statuses"
                    //}
                }
            },
            // The main query form
            query: {
                type:          "gpii.ul.search.query",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.form",
                options: {
                    model: "{search}.model"
                }
            },
            // The search results, if any
            products: {
                type:          "gpii.ul.search.products",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.products",
                options: {
                    model: {
                        products: "{search}.model.products",
                        offset:  "{search}.model.offset",
                        limit:   "{search}.model.limit"
                    }
                }
            },
            // The top pagination bar.
            topnav: {
                type:          "gpii.ul.search.navbar",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.topnav",
                options: {
                    model: {
                        totalRows: "{search}.model.totalRows",
                        offset:    "{search}.model.offset",
                        limit:     "{search}.model.limit"
                    }
                }
            },
            // TODO:  Try drawing both controls with a single selector and component
            // The bottom pagination bar
            bottomnav: {
                type:          "gpii.ul.search.navbar",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.bottomnav",
                options: {
                    model: {
                        totalRows: "{search}.model.totalRows",
                        offset:    "{search}.model.offset",
                        limit:     "{search}.model.limit"
                    }
                }
            },
            // The sortBying controls
            sortBy: {
                type:          "gpii.ul.search.sortBy",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.sortBy",
                options: {
                    model: {
                        select:   "{search}.model.sortBy"
                    }
                }
            },
            // The statuses filtering controls
            statuses: {
                type:          "gpii.ul.search.statuses",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.statuses",
                options: {
                    model: {
                        select: "{search}.model.statuses"
                    }
                }
            },
            // The "products per page" controls
            limit: {
                type:          "gpii.ul.search.limit",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.limit",
                options: {
                    model: {
                        select:   "{search}.model.limit"
                    }
                }
            },
            // A toggle to show/hide the search options
            optionsToggle: {
                type: "gpii.ul.toggle",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.container",
                options: {
                    selectors: {
                        toggle:    ".search-options-toggle",
                        container: ".search-options"
                    },
                    toggles: {
                        container: true
                    },
                    listeners: {
                        "onCreate.applyBindings": "{that}.events.onRefresh"
                    }
                }
            }
        },
        selectors: {
            initial:   ".search-viewport",
            success:   ".search-success",
            error:     ".search-error",
            form:      ".search-query",
            topnav:    ".search-topnav",
            products:  ".search-products",
            sortBy:    ".search-sortBy",
            statuses:  ".search-statuses",
            limit:     ".search-limit",
            bottomnav: ".search-bottomnav"
        },
        templates: {
            "initial": "search-viewport"
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: [ "initial", "{that}.options.templates.initial", "{that}.model"]
            }
        }
    });

    fluid.defaults("gpii.ul.search.hasUserControls", {
        gradeNames: ["gpii.ul.search", "gpii.ul.hasUserControls"]
    });
})();