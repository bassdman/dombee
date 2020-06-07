const { DombeeModel } = require('./generated/DombeeModel')

describe("DombeeModel", function() {

    beforeEach(function() {
        //  Dombee.reset();
    });

    it("should exist as a function", function() {
        expect(typeof DombeeModel).toEqual('function');
    });

    it("should be able to be called without parameter", function() {
        expect(() => DombeeModel()).not.toThrow();
    });

    it("should return an Object", function() {
        expect(DombeeModel()).toEqual({});
    });

    it("should return {name:'abc'} if inputdata is {name:'abc'}", function() {
        expect(DombeeModel({ name: 'abc' })).toEqual({ name: 'abc' });
    });

    it("should throw an Error if data is not an Object", function() {
        expect(() => DombeeModel('invalid:a string')).toThrow('datainvalid:noobject');
    });

    it("should throw an Error if data is an Array", function() {
        expect(() => DombeeModel([])).toThrow('datainvalid:noobject');
    });



    describe('with config.onChange defined', () => {
        const data = { name: 'abc', age: 23, computed(state) { return state.age + state.age } };

        let onChange;
        let dm;
        beforeEach(() => {
            onChange = jasmine.createSpy('onChange');
            dm = DombeeModel(data, { onChange });
        });

        it("should not call onChange if no property is changed", function() {
            expect(onChange).not.toHaveBeenCalled();
        });

        it("should call onChange 1x if dm.name changed", function() {
            dm.name = 'def';

            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it("should call onChange with params {name:'def'},'name','def'", function() {
            dm.name = 'def';

            expect(onChange).toHaveBeenCalledWith(data, 'name', 'def');
        });

        it("should call onChange 1x if dm.age changed due to dependency of computed fn", function() {
            dm.age = 25;

            expect(onChange).toHaveBeenCalledTimes(2);
        });
    })

    /* it("should return an object if it is instanciated", function() {
         const instance = DombeeModel({});
         expect(typeof instance).toEqual('object');
     });*/
});