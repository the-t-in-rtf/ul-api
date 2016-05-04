// Test fixtures to confirm that our CORS headers work in actual browsers.
/* globals fluid, $ */
"use strict";
(function () {
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.test.ul.api.cors.requestor");

    gpii.test.ul.api.cors.requestor.makeRequest = function (that) {
        var options = {
            url:      that.options.url,
            success:  that.handleSuccess,
            error:    that.handleError,
            complete: that.events.onRequestComplete.fire,
            headers: {
                accept: "application/json"
            }
        };
        $.ajax(options);
    };
    
    gpii.test.ul.api.cors.requestor.displayResponse = function (that, template, rawPayload) {
        // We want to be able to handle whatever messages we might receive, but also to display them inline in raw HTML.
        var stringPayload = typeof rawPayload === "string" ? rawPayload : "<pre>" + JSON.stringify(rawPayload, null, 2) + "</pre>";
        var payload = fluid.stringTemplate(template, { body: stringPayload });
        $(that.container).html(payload);
    };

    // A test component that makes a jquery request and updates a view with the results.
    fluid.defaults("gpii.test.ul.api.cors.requestor", {
        gradeNames: ["fluid.viewComponent"],
        url: "http://localhost:6914/api/product/unified/unifiedNewer",
        events: {
            onRequestComplete: null
        },
        templates: {
            success: "<div class='callout success'><h1>Success!</h1><p>%body</p></div>",
            error:   "<div class='callout alert'><h1>Error!</h1><p>%body</p></div>"
        },
        invokers: {
            handleError: {
                funcName: "gpii.test.ul.api.cors.requestor.displayResponse",
                args:     ["{that}", "{that}.options.templates.error", "{arguments}.2"] // jqXHR, textStatus, errorThrown
            },
            handleSuccess: {
                funcName: "gpii.test.ul.api.cors.requestor.displayResponse",
                args:     ["{that}", "{that}.options.templates.success", "{arguments}.0"] // data, textStatus, jqXHR
            },
            makeRequest: {
                funcName: "gpii.test.ul.api.cors.requestor.makeRequest",
                args:     ["{that}"]
            }
        }
    });
})();