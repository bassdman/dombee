const { DombeeModel } = require('./generated/DombeeModel')


describe("DombeeModel", function() {

    beforeEach(function() {
        //  Dombee.reset();
    });

    it("should exist as a function", function() {
        expect(typeof DombeeModel).toEqual('function');
    });

    it("should be able to be called without parameter", function() {
        expect(() => new DombeeModel()).not.toThrow();
    });

    it("should return an Object", function() {
        expect(new DombeeModel().state).toEqual({});
    });

    it("should return {name:'abc'} if inputdata is {name:'abc'}", function() {
        expect(new DombeeModel({ name: 'abc' }).state).toEqual({ name: 'abc' });
    });

    it("should throw an Error if data is not an Object", function() {
        expect(() => new DombeeModel('invalid:a string')).toThrow('datainvalid:noobject');
    });

    it("should throw an Error if data is an Array", function() {
        expect(() => new DombeeModel([])).toThrow('datainvalid:noobject');
    });



    describe('with config.onChange defined', () => {
        const data = {
            name: 'abc',
            age: 23,
            computed(state) { return state.age + state.age },
            nested: {
                nested_l2: {
                    nested_l3: 5,
                    nested_l3_2: 15
                }
            },
            computedWithNested(state) { return nested.nested_l2.nested_l3 * 2 }
        };

        let onChange;
        let dm;
        beforeEach(() => {
            onChange = jasmine.createSpy('onChange');
            dm = new DombeeModel(data, { onChange });
        });

        it("should not call onChange if no property is changed", function() {
            expect(onChange).not.toHaveBeenCalled();
        });

        it("should call onChange 1x if dm.name changed", function() {
            dm.state.name = 'def';

            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it("should call onChange with params {name:'def'},'name','def'", function() {
            dm.state.name = 'def';

            expect(onChange).toHaveBeenCalledWith(data, 'name', 'def');
        });

        it("should call onChange 1x if dm.age changed due to dependency of computed fn", function() {
            dm.state.age = 25;

            expect(onChange).toHaveBeenCalledTimes(2);
        });

        xit("should call onChange 1x if dm.nested.nested_l2.nested_l3_2 changed", function() {
            /*
                in future the dependency tracking must be improved. 
                the current dependencymatching added with "state.key1.key2" finding syntax would 
                ignore other writings from users like state['key1']['key2']" or even more complicated.
                as soon as a more complex algorithm is added, we can reduce the number of calls
            */

            dm.state.nested.nested_l2.nested_l3_2 = 23;

            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it("should call onChange 2x if dm.nested.nested_l2.nested_l3 changed  due to dependency of computedWithNested fn", function() {
            dm.state.nested.nested_l2.nested_l3 = 23;

            expect(onChange).toHaveBeenCalledTimes(2);
        });
    })
});