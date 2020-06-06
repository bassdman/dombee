const { DombeeModel } = require('./generated/DombeeModel')

describe("DombeeModel", function() {

    beforeEach(function() {
        //  Dombee.reset();
    });

    it("should exist as a function", function() {
        expect(typeof DombeeModel).toEqual('function');
    });

    /* it("should return an object if it is instanciated", function() {
         const instance = DombeeModel({});
         expect(typeof instance).toEqual('object');
     });*/
});