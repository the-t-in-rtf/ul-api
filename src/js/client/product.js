// TODO: Migrate this to a "content aware" part of the API when this feature is complete:  https://github.com/GPII/gpii-express/pull/6
// Component to display the view/edit interface for a single product.

/* global fluid */
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");

    // TODO:  Fix this to enable reviewer editing of the "status" field.
    // The sub-component that handles editing the "status" field.
    fluid.defaults("gpii.ul.product.edit.status", {
        gradeNames: ["gpii.ul.select"],
        template: "product-edit-status",
        select: {
            options: [
                { value: "new", label: "New"},
                { value: "active", label: "Active"},
                { value: "discontinued", label: "Discontinued"},
                { value: "deleted", label: "Deleted"},
            ]
        },
        selectors:  {
            select:  ""
        }
    });

    // The component that handles the binding, etc. for the "Edit" form.
    fluid.defaults("gpii.ul.product.edit", {
        // gradeNames: ["gpii.handlebars.templateFormControl"],
        gradeNames: ["gpii.schemas.client.errorAwareForm"],
        schemaKey:  "product-update-input.json",
        ajaxOptions: {
            url:         "/api/product",
            method:      "PUT",
            // processData: false,
            contentType: "application/json",
            headers: {
                accept: "application/json"
            }
        },
        rules: {
            // TODO: Decouple the validation payload from the request payload, so that we can enable "live" validation.  Currently doesn't work because the "payload" is a string and no longer a JSON object.
            modelToRequestPayload: {
                "": {
                    transform: {
                        type:      "fluid.transforms.objectToJSONString",
                        inputPath: "product"
                    }
                }
            },
            errorResponseToModel: {
                "": "responseJSON"
            },
            successResponseToModel: {
                "":      "notfound",
                message: "Your changes have been saved."
            }
        },
        templates: {
            initial: "product-edit"
        },
        selectors: {
            status:           ".product-edit-status",
            name:             ".product-edit-name",
            description:      ".product-edit-description",
            source:           ".product-edit-source",
            sid:              ".product-edit-sid",
            uid:              ".product-edit-uid",
            manufacturerName: ".manufacturer-name",
            address:          ".manufacturer-address",
            cityTown:         ".manufacturer-citytown",
            provinceRegion:   ".manufacturer-provinceregion",
            postalCode:       ".manufacturer-postalcode",
            country:          ".manufacturer-country",
            email:            ".manufacturer-email",
            phone:            ".manufacturer-phone",
            url:              ".manufacturer-url",
            error:            ".product-edit-error",
            success:          ".product-edit-success",
            submit:           ".product-edit-submit"
        },
        hideOnSuccess: false,
        hideOnError:   false,
        bindings: {
            name:             "product.name",
            description:      "product.description",
            // "status" is handled by a subcomponent (see below)
            // status: "product.status",
            source:           "product.source",
            sid:              "product.sid",
            uid:              "product.uid",
            manufacturerName: {
                selector: "manufacturerName",
                path:     "product.manufacturer.name",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            },
            address: {
                selector: "address",
                path:     "product.manufacturer.address",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            },
            cityTown: {
                selector: "cityTown",
                path:     "product.manufacturer.cityTown",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            },
            provinceRegion: {
                selector: "provinceRegion",
                path:     "product.manufacturer.provinceRegion",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            },
            postalCode: {
                selector: "postalCode",
                path:     "product.manufacturer.postalCode",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            },
            country: {
                selector: "country",
                path:     "product.manufacturer.country",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            },
            email: {
                selector: "email",
                path:     "product.manufacturer.email",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            },
            phone: {
                selector: "phone",
                path:     "product.manufacturer.phone",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            },
            url: {
                selector: "url",
                path:     "product.manufacturer.url",
                rules: {
                    domToModel: {
                        "": { transform: { type:  "gpii.schemas.transforms.stripEmptyString", inputPath: "" } }
                    }
                }
            }
        },
        errorBindings: {
            name:             "name",
            description:      "description",
            source:           "source",
            sid:              "sid",
            uid:              "uid",
            manufacturerName: "manufacturer.name",
            address:          "manufacturer.address",
            cityTown:         "manufacturer.cityTown",
            provinceRegion:   "manufacturer.provinceRegion",
            postalCode:       "manufacturer.postalCode",
            country:          "manufacturer.country",
            email:            "manufacturer.email",
            phone:            "manufacturer.phone",
            url:              "manufacturer.url"
        },
        components: {
            status: {
                type:          "gpii.ul.product.edit.status",
                createOnEvent: "{edit}.events.onMarkupRendered",
                container:     "{edit}.dom.status",
                options: {
                    model: {
                        select:   "{edit}.model.product.status"
                    }
                }
            }
        }
    });

    fluid.registerNamespace("gpii.ul.product");

    // Defer to the parent success handler, but fire an event to instantiate the toggle and edit components if appropriate.
    // TODO: Migrate to using permissions to check whether editing should be allowed.
    // TODO: Delegate handling of the "edit" panel to a subcomponent
    gpii.ul.product.checkReadyToEdit = function (that) {
        var editControls    = that.locate("editControls");
        var suggestControls = that.locate("suggestControls");

        if (that.model.product && that.model.product.source === "unified" && that.model.user && that.model.user.roles && that.model.user.roles.indexOf("reviewers") !== -1) {
            editControls.show();
            suggestControls.hide();
            that.events.onReadyForEdit.fire(that);
        }
        else {
            editControls.hide();
            suggestControls.show();
        }
    };

    // Convenience grade to avoid repeating the common toggle options for all three toggles (see below).
    fluid.defaults("gpii.ul.product.toggle", {
        gradeNames: ["gpii.ul.toggle"],
        selectors: {
            editForm: ".product-edit",
            viewForm: ".product-view"
        },
        toggles: {
            editForm: true,
            viewForm: true
        }
    });

    // Grade to handle the special case of hiding the edit form when the record is saved successfully
    fluid.registerNamespace("gpii.ul.product.toggle.onSave");
    gpii.ul.product.toggle.onSave.hideOnSuccess = function (that, success) {
        if (success) {
            that.performToggle();
        }
    };

    fluid.defaults("gpii.ul.product.toggle.onSave", {
        gradeNames: ["gpii.ul.product.toggle"],
        invokers: {
            hideOnSuccess: {
                funcName: "gpii.ul.product.toggle.onSave.hideOnSuccess",
                args:     ["{that}", "{arguments}.0"]
            }
        }
    });

    // The component that loads the product content and controls the initial rendering.  Subcomponents
    // listen for this component to give the go ahead, and then take over parts of the interface.

    fluid.defaults("gpii.ul.product", {
        gradeNames: ["gpii.handlebars.templateAware"],
        baseUrl:    "/api/product/",
        selectors: {
            viewport:        ".product-viewport",
            editControls:    ".product-edit-control-panel",
            suggestControls: ".product-suggest-control-panel"
        },
        mergePolicy: {
            rules: "noexpand"
        },
        ajaxOptions: {
            method:   "GET",
            dataType: "json",
            headers: {
                accept: "application/json"
            }
        },
        model: {
            successMessage: false,
            errorMessage:   false,
            product:        false,
            user:           false
        },
        rules: {
            modelToRequestPayload: {
                "":      "notfound",
                sources: { literalValue: true }
            },
            successResponseToModel: {
                "":     "notfound",
                product: "responseJSON"
            },
            ajaxOptions: {
                dataType: "json",
                // TODO:  Make the header bits part of a standard grade
                // This is the only way I've found to avoid jQuery.ajax() adding */* to the list of accepted formats.
                headers: {
                    accept: "application/json"
                },
                url: {
                    transform: {
                        type: "gpii.ul.stringTemplate",
                        input: "%baseUrl%source/%sid",
                        terms: {
                            baseUrl: "{that}.options.baseUrl",
                            source:  "{that}.options.req.query.source",
                            sid:     "{that}.options.req.query.sid"
                        }
                    }
                }
            }
        },
        template: "product-viewport",
        events: {
            onEditRendered: null,
            onReadyForEdit: null,
            onRenderedAndReadyForEdit: {
                events: {
                    onReadyForEdit:   "onReadyForEdit",
                    onMarkupRendered: "onMarkupRendered"
                }
            },
            onViewRendered: null
        },
        modelListeners: {
            product: {
                func: "{that}.checkReadyToEdit"
            },
            user: {
                func: "{that}.checkReadyToEdit"
            }
        },
        components: {
            view: {
                type:          "gpii.handlebars.templateMessage",
                container:     ".product-view",
                createOnEvent: "{product}.events.onMarkupRendered",
                options: {
                    template: "product-view",
                    model:    "{product}.model",
                    listeners: {
                        "onMarkupRendered.notifyParent": {
                            func: "{product}.events.onViewRendered.fire"
                        },
                        // Check to see if our "edit" button should be visible on render
                        "onMarkupRendered.checkReadyToEdit": {
                            func: "{product}.checkReadyToEdit"
                        }
                    }
                }
            },
            edit: {
                type:          "gpii.ul.product.edit",
                createOnEvent: "{product}.events.onRenderedAndReadyForEdit",
                container:     ".product-edit",
                options: {
                    model: {
                        product: "{product}.model.product"
                    }
                }
            },
            // Toggles must exist at this level so that they can be aware of both the view and edit form, thus we have
            // two very similar toggle controls that are instantiated if we're editing, and which are rebound as needed.
            toggleFromView: {
                type:          "gpii.ul.product.toggle",
                createOnEvent: "{product}.events.onRenderedAndReadyForEdit",
                container:     "{product}.container",
                options: {
                    selectors: {
                        toggle: ".product-view .product-toggle"
                    },
                    events: {
                        // Our view may be redrawn over and over again, and we have to make sure our bindings work each time.
                        onRefresh: {
                            events: {
                                parentReady: "{product}.events.onViewRendered"
                            }
                        }
                    },
                    // We need to refresh on startup because the view may already have been rendered.
                    listeners: {
                        "onCreate.refresh": {
                            func: "{that}.events.onRefresh.fire"
                        }
                    }
                }
            },
            toggleFromEdit: {
                type:          "gpii.ul.product.toggle",
                createOnEvent: "{product}.events.onRenderedAndReadyForEdit",
                container:     "{product}.container",
                options: {
                    selectors: {
                        toggle: ".product-edit .product-toggle"
                    },
                    // The edit form is only rendered once, and before us, so we can just apply our bindings on creation.
                    listeners: {
                        "onCreate.applyBindings": {
                            func: "{that}.events.onRefresh.fire"
                        }
                    }
                }
            },
            // The last toggle has no controls, and is used to hide the editing interface when the record is saved successfully.
            toggleAfterSave: {
                type:          "gpii.ul.product.toggle.onSave",
                createOnEvent: "{product}.events.onRenderedAndReadyForEdit",
                container:     "{product}.container",
                options: {
                    listeners: {
                        "{edit}.events.requestReceived": {
                            func: "{that}.hideOnSuccess",
                            args: ["{arguments}.1"] // component, success
                        }
                    }
                }
            }
        },
        invokers: {
            checkReadyToEdit: {
                funcName: "gpii.ul.product.checkReadyToEdit",
                args:     ["{that}", "{arguments}.2"]
            },
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["viewport", "{that}.options.template", "{that}.model"]
            }
        }
    });
})();
