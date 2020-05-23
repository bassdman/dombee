export function createDirective(config, { document, state, values }) {
    if (config == null)
        throw new Error('Dombee.directive(config) failed. The first parameter must be a config object or function, but is null.');
    let directive = config;
    /*
        When the directive is wrapped in a function, unwrap this function
        Example: Dombee.directive(function testFn(){
            return {
                bindTo: 'aselector',
                onChange: () => { //do sth },
                expressions: ['expression1','expression2']
            }
        })
        will result in
        {
            name: 'testFn'
            bindTo: 'aselector',
            onChange: () => { //do sth },
            expressions: ['expression1','expression2']
        }
    */
    if (typeof config == 'function') {
        directive = config({ state, data: values });
        if (directive == null)
            throw new Error('Dombee.directive(config) failed. Your first parameter is a function (' + config + ') but it returns null. Did you forget to return the configuration?');
        directive.name = config.name;
    }
    if (directive.onChange == null)
        throw new Error('Dombee.directive(config) failed. Your directive config needs property "onChange" to be initialized successfully.');
    if (typeof directive.onChange !== 'function')
        throw new Error('Dombee.directive(config) failed. config.onChange must be a function.');
    if (!(typeof directive.expressions == 'function'))
        throw new Error('Dombee.directive(config) failed. config.expressions must be a function. But it is typeof ' + typeof config.expressions);
    if (!(typeof directive.bindTo == 'string' || typeof directive.bindTo == 'function' || Array.isArray(directive.bindTo)))
        throw new Error('Dombee.directive(config) failed. config.bindTo must be an Array, a String or a function that returns an Array or a string. But it is ' + typeof config.bindTo);
    /*
        Initialize the elements attribute
    */
    directive.elements = initElements(directive.bindTo, directive, document);


    return directive;
}

function initElements(_elements, directive, document) {
    let elements = _elements;

    if (typeof elements == 'function')
        elements = elements();

    if (!elements)
        throw new Error(`Dombee.directive(config) failed for directive ${directive.name}. config.bindTo returns null but should return a selector, element, Array of elements or function that returns one of these.`);

    if (Array.isArray(elements)) {
        for (let elem of elements) {
            if (!isDomElement(elem) && !typeof elem.expression == 'string')
                throw new Error(`Error in function Dombee.directive(config). config.bindTo returns an Array, but with invalid elements. Only DOMElements are allowed. But it has ${elem}`);
        }
        return elements;
    }

    if (typeof elements == 'string')
        return document.querySelectorAll(elements) || [];

    return [elements];
}

function isDomElement(elemToProove) {
    try {
        // var elem = getDocument().createElement('div');
        return elemToProove.tagName != null;
    } catch (e) {
        return false;
    }
}