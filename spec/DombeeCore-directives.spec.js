const { getDombeeCoreInstance } = require('./helpers/helpers');
const { defaultConfig, onChange, expressions, bindTo } = require('./helpers/defaults');
let Dombee;

describe("Dombee.directive", function() {
    beforeEach(() => {
        Dombee = getDombeeCoreInstance();
        Dombee.reset();
    });

    it("should should exist as function in global Dombee Object", function() {
        expect(typeof Dombee.directive).toBe('function');
    });

    it("should throw an error if called with null", function() {
        Dombee.directive();
        expect(() => Dombee(defaultConfig)).toThrow();
    });
    it("should accept objects as parameter", function() {
        Dombee.directive({ onChange, expressions, bindTo })
        expect(() => Dombee(defaultConfig)).not.toThrow();
    });
    it("should accept functions as parameter", function() {
        Dombee.directive(function() { return { onChange, expressions, bindTo } });
        expect(() => Dombee(defaultConfig)).not.toThrow();
    });

    it("should not throw an error if Directive is not found in DOM", function() {
        Dombee.directive(function() { return { onChange, expressions, bindTo } });
        expect(() => Dombee({ bindTo: 'body', data: { name: 'test' } })).not.toThrow();
    });

    describe('with object as parameter', function() {
        it("should throw an error if property 'onChange' is null", function() {
            Dombee.directive({ expressions });
            expect(() => Dombee({}).toThrow());
        });
        it("should throw an error if property 'expressions' is null", function() {
            Dombee.directive({ onChange });
            expect(() => Dombee({}).toThrow());
        });
        it("should not throw an error if property 'bindTo' is null", function() {
            Dombee.directive({ onChange, expressions, bindTo });
            expect(() => Dombee({}).not.toThrow());
        });
    });
    describe('property "onChange"', function() {
        it("should be valid if it is a function", function() {
            Dombee.directive({ onChange: function() {}, expressions });
            expect(() => Dombee(defaultConfig).not.toThrow());
        });
        it("should throw an error if it is not a function", function() {
            Dombee.directive({ onChange: 'abc', expressions });
            expect(() => Dombee(defaultConfig).toThrow());
        });
    });
    describe('property "expressions"', function() {
        it("should throw an error if it is an Array", function() {
            Dombee.directive({ onChange, expressions, bindTo: ['abc'] });
            expect(() => Dombee(defaultConfig)).toThrow();
        });
        it("should throw an error if it is a number", function() {
            Dombee.directive({ onChange, expressions, bindTo: 1 });

            expect(() => Dombee(defaultConfig)).toThrow();
        });

        it("should be valid if it is a function returning an object having a key 'expression'", function() {
            Dombee.directive({
                bindTo,
                onChange,
                expressions: () => {
                    return {
                        expression: 'xyz'
                    }
                }
            });

            expect(() => Dombee(defaultConfig)).not.toThrow();
        });

        it("should throw an error if it is an object having a key 'expression'", function() {
            Dombee.directive({
                onChange,
                expressions: {
                    expression: 'xyz'
                }
            });

            expect(() => Dombee(defaultConfig)).toThrow();
        });
    });
});