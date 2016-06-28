// Test fixtures to confirm that our CORS headers work in actual browsers.
/* globals fluid, $, XMLHttpRequest */
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.test.ul.api.cors.requestor");

    gpii.test.ul.api.cors.requestor.makeRequest = function (that, url) {
        // We cannot use jQuery.ajax because it does not handle cross-domain errors in a way we can use.
        var client = new XMLHttpRequest();

        that.client = client;

        client.onerror = that.handleError;
        client.onload  = that.handleSuccess;

        client.open("GET", url);
        client.setRequestHeader("Accept", "application/json");
        client.send();
    };

    gpii.test.ul.api.cors.requestor.displayResponse = function (that, template) {
        var payload = fluid.stringTemplate(template, that.client);
        $(that.container).html(payload);
        that.events.onRequestComplete.fire(that);
    };

    // A test component that makes a jquery request and updates a view with the results.
    fluid.defaults("gpii.test.ul.api.cors.requestor", {
        gradeNames: ["fluid.viewComponent"],
        events: {
            onRequestComplete: null
        },
        templates: {
            success: "<div class='callout success'><h1>Success!</h1><p>%responseText</p><div class=\"status\">%status</div></div>",
            error:   "<div class='callout alert'><h1>Error!</h1><p>%responseText</p><div class=\"status\">%status</div></div>"
        },
        invokers: {
            handleError: {
                funcName: "gpii.test.ul.api.cors.requestor.displayResponse",
                args:     ["{that}", "{that}.options.templates.error"]
            },
            handleSuccess: {
                funcName: "gpii.test.ul.api.cors.requestor.displayResponse",
                args:     ["{that}", "{that}.options.templates.success"]
            },
            makeRequest: {
                funcName: "gpii.test.ul.api.cors.requestor.makeRequest",
                args:     ["{that}", "{arguments}.0"] // url
            }
        }
    });
})();
