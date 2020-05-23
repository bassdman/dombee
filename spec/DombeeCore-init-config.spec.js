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

fdescribe("Dombee({})", function() {

    beforeEach(function() {
        Dombee = getDombeeCoreInstance(renderHTML);
        Dombee.reset();
    });

    describe("attribute {renderTo:''}", function() {
        beforeEach(function() {
            Dombee.directive(textDirective);
        });

        it("should return a propery called 'root'", function() {
            const instance = Dombee({ data });
            expect(instance.root).toBeDefined();
        });
        it("should return a dom element (isDomElement() == true)", function() {
            const instance = Dombee({ data });
            expect(isDomElement(instance.root)).toBeTrue();
        });
        it("should return the Root-Element if configuration property 'renderTo' is undefined", function() {
            const instance = Dombee({ data });
            expect(instance.root.tagName).toBe('HTML');
        });
        it("should return the tag with id 'content1' for configuration {renderTo: '#content1'}", function() {
            const instance = Dombee({ data, renderTo: '#content1' });
            expect(instance.root.id).toBe('content1');
        });

        it("should render only #text1 for config {data:{name:'test'}} - renderTo=undefined", function() {
            const instance = Dombee({ data: { name: 'test' } });
            const found = instance.root.querySelectorAll('[data-text]').length;
            const textValue1 = Dombee.document.querySelectorAll('[data-text]')[0].innerText;
            const textValue2 = Dombee.document.querySelectorAll('[data-text]')[1].innerText;
            expect(found).toBe(2);
            expect(textValue1).toBe('test');
            expect(textValue2).toBe('test');
        });

        it("should render #text1 for config {data:{name:'test'},renderTo:'#content2'}", function() {
            const instance = Dombee({ data: { name: 'test' }, renderTo: '#content2' });
            const found = instance.root.querySelectorAll('[data-text]').length;
            const textValue1 = Dombee.document.querySelectorAll('[data-text]')[0].innerText;
            const textValue2 = Dombee.document.querySelectorAll('[data-text]')[1].innerText;
            expect(found).toBe(1);
            expect(textValue1).toBeUndefined();
            expect(textValue2).toBe('test');
        });
    })
});