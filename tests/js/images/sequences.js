"use strict";
var fluid = require("infusion");
fluid.loadTestingSupport();

require("node-jqunit");

fluid.defaults("fluid.tests.elementPriority.log", {
    gradeNames: "fluid.test.sequenceElement",
    sequence: [{
        func: "fluid.log({that}.options.message)"
    }]
});

fluid.defaults("fluid.tests.elementPriority.check", {
    gradeNames: "fluid.test.sequenceElement",
    sequence: [{
        func: "jqUnit.assert",
        args: "I am the check, right at the end"
    }]
});

fluid.defaults("fluid.tests.elementPrioritySequence", {
    gradeNames: "fluid.test.sequence",
    sequenceElements: {
        check: {
            gradeNames: "fluid.tests.elementPriority.check",
            priority: "after:end"
        },
        end: {
            gradeNames: "fluid.tests.elementPriority.log",
            options: {
                message: "I am at the end, just before the check"
            },
            priority: "after:sequence"
        },
        postBeginning: {
            gradeNames: "fluid.tests.elementPriority.log",
            options: {
                message: "I come after the beginning"
            },
            priority: "after:beginning"
        },
        beginning: {
            gradeNames: "fluid.tests.elementPriority.log",
            options: {
                message: "I will be executed first"
            },
            priority: "before:sequence"
        }
    }
});

fluid.defaults("fluid.tests.elementPriority", {
    gradeNames: ["fluid.test.testEnvironment", "fluid.test.testCaseHolder"],
    modules: [{
        name: "Priority-driven grade budding",
        tests: [{
            expect: 1,
            name: "Simple sequence of 4 active elements",
            sequenceGrade: "fluid.tests.elementPrioritySequence",
            sequence: [{
                func: "fluid.log",
                args: "I am the original sequence, in the middle"
            }]
        }
        ]
    }]
});

fluid.test.runTests("fluid.tests.elementPriority");
