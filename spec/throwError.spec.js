const { throwError, throwErrorIf, errorMode } = require('./generated/throwError');

describe("throwError", function() {
    beforeEach(function() {
        errorMode('production');
    });
    afterEach(function() {
        //sinnvoll, um keine anderen Tests zu beeinflussen, bei denen der Modus nur einmalig gesetzt wird
        errorMode('development');
    });

    it("should exist as a function", function() {
        expect(typeof throwError).toEqual('function');
    });

    it("should exist as a function", function() {
        expect(typeof throwError).toEqual('function');
    });

    it("should throw an Error with Message 'custom message'", function() {
        expect(() => throwError("custom message")).toThrow(new Error("custom message"));
    });

    it("should throw an Error with Message 'custom message' when having identifier 'cm'", function() {
        expect(() => throwError("custom message", "cm")).toThrow(new Error("custom message"));
    });


    it("should throw 'cm' when having identifier 'cm' with errorMode='development'", function() {
        errorMode('development');
        expect(() => throwError("custom message", "cm")).toThrow('cm');
    });
});

describe("throwErrorIf", function() {
    beforeEach(function() {
        errorMode('production');
    });
    afterEach(function() {
        //sinnvoll, um keine anderen Tests zu beeinflussen, bei denen der Modus nur einmalig gesetzt wird
        errorMode('development');
    });

    it("should exist as a function", function() {
        expect(typeof throwErrorIf).toEqual('function');
    });

    it("should not throw an Error without arguments", function() {
        expect(() => throwErrorIf()).not.toThrow();
    });

    it("should throw an Error if first Parameter is truthy", function() {
        expect(() => throwErrorIf(true)).toThrow();
    });

    it("should not throw an Error if first Parameter is falsy", function() {
        expect(() => throwErrorIf(false)).not.toThrow();
    });

    it("should throw an Error with Message 'custom message'", function() {
        expect(() => throwErrorIf(true, "custom message")).toThrow(new Error("custom message"));
    });

    it("should throw an Error with Message 'custom message' when having identifier 'cm'", function() {
        expect(() => throwErrorIf(true, "custom message", "cm")).toThrow(new Error("custom message"));
    });


    it("should throw 'cm' when having identifier 'cm' with errorMode='development'", function() {
        errorMode('development');
        expect(() => throwErrorIf(true, "custom message", "cm")).toThrow('cm');
    });
});

describe("errorMode", function() {
    it("should exist as a function", function() {
        expect(typeof errorMode).toEqual('function');
    });
});