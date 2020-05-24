const { getDombeeCoreInstance } = require('./helpers/helpers');
const Dombee = getDombeeCoreInstance();

describe("Dombee.onLoad", function() {

    beforeEach(function() {
        Dombee.reset();
    });

    it("should exist as a function", function() {
        expect(typeof Dombee.onLoad).toEqual('function');
    });
    it("should execute a function given as first parameter", function() {
        const spyFunction = jasmine.createSpy('plugin')
        Dombee.onLoad(spyFunction);
        Dombee({});
        expect(spyFunction).toHaveBeenCalled();
    });
    it("function should have Dombee Object as first parameter", function() {
        const spyFunction = jasmine.createSpy('plugin')
        Dombee.onLoad(spyFunction);
        Dombee({});
        expect(spyFunction).toHaveBeenCalledWith({ state: {}, cache: { _localDumbeeCache: true, bindings: {}, dependencies: {} }, $root: Dombee.documentMock.createElement('div') });
    });
});