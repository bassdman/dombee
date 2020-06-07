const { DombeeModel } = require('./generated/DombeeModel')

fdescribe("DombeeModel", function() {

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

    it("should not call onChange if onchange is passed by config", function() {
        const onChange = jasmine.createSpy('onChange');
        DombeeModel({}, { onChange });
        expect(onChange).not.toHaveBeenCalled();
    });

    describe('with data.name changed and config.onChange defined', () => {
        let onChange;
        beforeEach(() => {
            onChange = jasmine.createSpy('onChange');
            const dm = DombeeModel({ name: 'abc' }, { onChange });
            dm.name = 'def';
        });

        it("should call onChange 1x", function() {
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it("should call onChange with params {name:'def'},'name','def'", function() {
            expect(onChange).toHaveBeenCalledWith({ name: 'def' }, 'name', 'def');
        });
    })

    /* it("should return an object if it is instanciated", function() {
         const instance = DombeeModel({});
         expect(typeof instance).toEqual('object');
     });*/
});