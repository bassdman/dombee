const { getDombeeCoreInstance, isDomElement, textDirective } = require('./helpers/helpers');
const data = {};
let Dombee;
const renderHTML = `<html>
    <head></head>
    <body>
        <div id="content1">
            <span data-text="name" id="text1"></span>
        </div>
        <div id="content2">
            <span data-text="name" id="text2"></span>
        </div>
    </body>
</html>`;

describe("Dombee({})", function() {

    beforeEach(function() {
        Dombee = getDombeeCoreInstance(renderHTML);
        Dombee.reset();
        Dombee.directive(textDirective);
    });

    it("should not throw an error if Dombee is called without args", function() {
        expect(() => Dombee()).not.toThrow();
    });
    it("should have empty root element if called with empty constructor", function() {
        const instance = Dombee();
        expect(instance.root.outerHTML).toBe('<div></div>');
    });

    describe("attribute {renderTo:''}", function() {
        it("should return a propery called 'root'", function() {
            const instance = Dombee({ data });
            expect(instance.root).toBeDefined();
        });
        it("should return a dom element (isDomElement() == true)", function() {
            const instance = Dombee({ data });
            expect(isDomElement(instance.root)).toBeTrue();
        });
        it("should return an empty DIV-Element if configuration property 'renderTo' is undefined", function() {
            const instance = Dombee({ data });
            expect(instance.root.outerHTML).toBe('<div></div>');
        });
        it("should return the tag with id 'content1' for configuration {renderTo: '#content1'}", function() {
            const instance = Dombee({ data, renderTo: '#content1' });
            expect(instance.root.id).toBe('content1');
        });

        it("should render #text1 for config {data:{name:'test'},renderTo:'#content2'}", function() {
            const instance = Dombee({ data: { name: 'test' }, renderTo: '#content2' });
            const found = instance.root.querySelectorAll('[data-text]').length;
            const textValue1 = Dombee.documentMock.querySelectorAll('[data-text]')[0].innerText;
            const textValue2 = Dombee.documentMock.querySelectorAll('[data-text]')[1].innerText;
            expect(found).toBe(1);
            expect(textValue1).toBeUndefined();
            expect(textValue2).toBe('test');
        });
    })

    describe("attribute {template:''}", function() {
        it("should have a root-Element with outerHTML '<span></span>' if template is <span></span>", function() {
            const instance = Dombee({ template: '<span></span>' });
            expect(instance.root.innerHTML).toBe('<span></span>');
        });
        it("should render the '<span></span>' into #content1 if both template and renderTo are defined", function() {
            Dombee({ template: '<span></span>', renderTo: '#content1' });
            const $content1Element = Dombee.documentMock.getElementById('content1');
            expect($content1Element.innerHTML).toBe('<span></span>');
        });
    })
});