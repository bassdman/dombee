const { getDombeeCoreInstance } = require('./helpers/helpers');
const Dombee = getDombeeCoreInstance();

describe("Dombee", function() {

    beforeEach(function() {
        Dombee.reset();
    });

    it("should return a function", function() {
        expect(typeof Dombee).toEqual('function');
    });
    it("should have a global property called 'directive'", function() {
        expect(Dombee.directive).toBeDefined();
    });
    it("should have a global property called 'directive'", function() {
        expect(Dombee.directive).toBeDefined();
    });
    it("should have a global property called 'dependencyEvaluationStrategy'", function() {
        expect(Dombee.dependencyEvaluationStrategy).toBeDefined();
    });
    it("should have a global property called 'dependencyEvaluationStrategyDefault'", function() {
        expect(Dombee.dependencyEvaluationStrategyDefault).toBeDefined();
    });
    it("should have a global property called 'addExpressionType'", function() {
        expect(Dombee.addExpressionType).toBeDefined();
    });
    it("should have a global property called 'expressionTypeJs'", function() {
        expect(Dombee.expressionTypeJs).toBeDefined();
    });
    it("should have a global property called 'expressionTypeJsTemplateString'", function() {
        expect(Dombee.expressionTypeJsTemplateString).toBeDefined();
    });
    it("should have a global property called '_id'", function() {
        expect(Dombee._id).toBeDefined();
    });
});