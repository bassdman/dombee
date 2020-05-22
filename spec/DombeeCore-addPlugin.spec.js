const { getDombeeCoreInstance } = require('./helpers/helpers');
const Dombee = getDombeeCoreInstance();

describe("Dombee.addPlugin", function() {

    beforeEach(function() {
        Dombee.reset();
    });

    it("should exist as a function", function() {
        expect(typeof Dombee.addPlugin).toEqual('function');
    });
    it("should execute a function given as first parameter", function() {
        const spyFunction = jasmine.createSpy('plugin')
        Dombee.addPlugin(spyFunction);
        Dombee({});
        expect(spyFunction).toHaveBeenCalled();
    });
    it("plugin function should have Dombee Object as first parameter", function() {
        const spyFunction = jasmine.createSpy('plugin')
        Dombee.addPlugin(spyFunction);
        Dombee({});
        expect(spyFunction).toHaveBeenCalledWith(Dombee);
    });
});