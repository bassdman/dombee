import { dependencyEvaluationStrategyDefault, expressionTypeJs, expressionTypeJsTemplateString } from "./defaults.js";
import { randomId } from "./helpers/randomId.js";
import cloneDeep from 'lodash.clonedeep';


const initialGlobalCache = {
    directives: [],
    events: {
        onload: []
    },
    dependencyEvaluationStrategy: dependencyEvaluationStrategyDefault,
    expressionTypes: {
        "js": expressionTypeJs,
        "js-template-string": expressionTypeJsTemplateString
    },
    defaultExpressionTypes: ['js', 'js-template-string']
};
let globalCache = cloneDeep(initialGlobalCache);


function Dombee(_state = {}) {
    const watched = {};

    const cache = {
        _localDumbeeCache: true,
        bindings: {},
        dependencies: {}
    };

    const state = new Proxy(_state, {
        set(target, property, value) {
            target[property] = value;
            render(target, property, value);

            for (let dependency of cache.dependencies[property]) {
                render(target, dependency, state[dependency]);
            }

            return true;
        },
        get(obj, prop) {
            const value = obj[prop];
            return value;
        }
    });

    for (let onload of globalCache.events.onload) {
        onload({ cache, state });
    }

    function compute(text = '', expressionTypes) {
        const _values = values();
        const paramValues = Object.keys(_values).map(key => _values[key]);

        const fn = typeof text == 'string' ? toFn(text, expressionTypes) : text;
        const result = fn(...paramValues); //wirft einen Fehler, wenn invalide
        return result;
    }

    function toFn(text, expressionTypes) {

        const _values = values('parsable');

        for (let expressionTypeKey of expressionTypes) {
            try {
                const expressionTypeFn = globalCache.expressionTypes[expressionTypeKey];
                if (expressionTypeFn == null)
                    throw `Expressiontype "${expressionTypeKey}" does not exist. If the name is correct, please add it with "Dombee.addExpressionType('${expressionTypeKey}', function(text,values){/*your code here*/})"`;

                return expressionTypeFn(text, _values);
            } catch (e) {
                if (typeof e == 'string')
                    throw new Error(e);
                // This expressionType did not succeed. Maybe it is another one.
                // Try next one
            }
        }

        //no expressiontype succeeded, throw error;
        throw new Error(`Expression ${text} can not be parsed.`);
    }

    function getExpressionTypes(directive) {
        if (!directive || !directive.expressionTypes)
            return globalCache.defaultExpressionTypes;

        if (Array.isArray(directive.expressionTypes))
            return directive.expressionTypes;

        return [directive.expressionTypes]

    }

    function addDependencies(expressionResult, name, elemid, directive = {}, ) {
        const fnText = expressionResult.expression ? expressionResult.expression.toString() : expressionResult.toString();

        const dependencies = globalCache.dependencyEvaluationStrategy(fnText, state);
        const expressionTypes = getExpressionTypes(directive);

        for (let key of dependencies) {

            if (!cache.dependencies[key]) {
                cache.dependencies[key] = [];
            }

            if (key !== name) {
                const matchid = elemid ? elemid + '_' + randomId('') : name;
                cache.dependencies[key].push(matchid);
                cache.bindings[matchid] = {
                    elemid,
                    name,
                    onChange: directive.onChange,
                    resultFn: toFn(expressionResult.expression ? expressionResult.expression : expressionResult, expressionTypes),
                    resultFnRaw: expressionResult.expression ? expressionResult.expression : expressionResult,
                    expression: expressionResult,
                    expressionTypes
                }
            }
        };
    }

    function isDomElement(elemToProove) {
        try {
            // var elem = getDocument().createElement('div');
            return elemToProove.tagName != null;
        } catch (e) {
            return false;
        }
    }

    function initElements(_elements, directive) {
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
            return getDocument().querySelectorAll(elements) || [];

        return [elements];
    }

    function values(parsable) {
        const retObj = {};

        Object.keys(state).forEach(key => {
            let value = state[key];
            let valueText = value;

            if (typeof value == 'function') {
                value = value(state);
                valueText = value;
            }

            if (value == null)
                valueText = "''";

            if (typeof value == 'string' && parsable)
                valueText = `'${value}'`;

            if (typeof value == 'object' && parsable)
                valueText = JSON.stringify(value);

            retObj[key] = valueText;
        });

        return retObj;
    }

    function getDocument() {
        return Dombee.document || document;
    }

    function watch(key, fn) {
        if (!watched[key])
            watched[key] = fn;
    }

    for (let _directive of globalCache.directives) {

        let directive = typeof _directive == 'function' ? _directive({ state, data: values() }) : _directive;
        directive = Object.assign({ name: _directive.name }, directive);

        const elements = initElements(directive.bindTo, directive);

        for (let elem of elements) {
            if (!elem.dataset)
                elem.dataset = {};

            const elemId = elem.dataset.id || randomId('id_');

            if (elem.dataset.id == null)
                elem.dataset.id = elemId;

            let expressions = directive.expressions(elem);
            if (!Array.isArray(expressions))
                expressions = [expressions];

            for (let expression of expressions) {
                addDependencies(expression, 0, elemId, directive);
            }

        }
    }

    const render = (state, prop, value) => {
        const toUpdate = cache.dependencies[prop] || [];
        for (let updateEntry of toUpdate) {
            const cacheUpdateEntry = cache.bindings[updateEntry];
            const elem = getDocument().querySelector(`[data-id="${cacheUpdateEntry.elemid}"]`);
            const result = compute(cacheUpdateEntry.resultFn, cacheUpdateEntry.expressionTypes);

            if (cacheUpdateEntry.onChange)
                cacheUpdateEntry.onChange(elem, result, { values, property: prop, value, expression: cacheUpdateEntry.expression });
        }
    };

    Object.keys(state).forEach(key => {
        if (typeof state[key] == 'function') {
            addDependencies(state[key], key);
        }

        render(state, key, state[key])
    });

    return {
        state,
        values: values(),
        watch,
        cache,
    }
};

function directive(config) {
    if (config == null)
        throw new Error('Dombee.directive(config) failed. The first parameter should be a config object or function, but is null.');

    if (config.onChange == null && typeof config == 'object')
        throw new Error('Dombee.directive(config) failed. Your directive config needs property "onChange" to be initialized successfully.');

    if (typeof config.onChange !== 'function' && typeof config == 'object')
        throw new Error('Dombee.directive(config) failed. config.onChange must be a function.');

    if (typeof config == 'object' && !(typeof config.expressions == 'string' || typeof config.expressions == 'function' || Array.isArray(config.expressions) || config.expressions.expression))
        throw new Error('Dombee.directive(config) failed. config.expressions must be an Array or a function that returns an Array or a string. But it is ' + typeof config.expressions);

    if (typeof config == 'object' && !(typeof config.bindTo == 'string' || typeof config.bindTo == 'function' || Array.isArray(config.bindTo)))
        throw new Error('Dombee.directive(config) failed. config.bindTo must be an Array, a String or a function that returns an Array or a string. But it is ' + typeof config.bindTo);

    globalCache.directives.push(config);
}

function dependencyEvaluationStrategy(fn) {
    if (fn == null)
        throw new Error('fn is null but must be a function;')

    Dombee.dependencyEvaluationStrategy = fn;
}

function addExpressionType(name, fn) {
    if (name == null)
        throw new Error('addExpressionType(name,fn) failed.  Name is undefined');

    if (fn == null)
        throw new Error('addExpressionType(name,fn) failed. Function fn is undefined');

    if (getScope(this).globalCache.expressionTypes[name])
        throw new Error('addExpressionType(name,fn) failed. Expressiontype ' + name + ' already exists an can not be overwritten. Please choose another name');

    Dombee.expressionTypes[name] = fn;
}

function addPlugin(plugin) {
    plugin(Dombee);
}

function onLoad(fn) {
    globalCache.events.onload.push(fn);
}

function reset() {
    globalCache = cloneDeep(initialGlobalCache);
}

Object.assign(Dombee, {
    directive,
    dependencyEvaluationStrategy,
    dependencyEvaluationStrategyDefault,
    addExpressionType,
    expressionTypeJs,
    expressionTypeJsTemplateString,
    addPlugin,
    onLoad,
    globalCache,
    reset,
    _id: randomId()
});

export {
    Dombee,
    directive,
    dependencyEvaluationStrategy,
    dependencyEvaluationStrategyDefault,
    addExpressionType,
    expressionTypeJs,
    expressionTypeJsTemplateString,
    addPlugin,
    onLoad,
    reset
};