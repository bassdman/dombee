import { dependencyEvaluationStrategyDefault } from "./defaults.js";

const globalCache = {
    directives: [],
    dependencyEvaluationStrategy: dependencyEvaluationStrategyDefault
}

function Dombee(_state = {}) {
    const watched = {};

    const cache = {
        bindings: {},
        dependencies: {}
    };

    function randomId(prefix) {
        return prefix + Math.random().toString(36).substring(2, 15);
    }

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

    function compute(text = '') {
        const _values = values();
        const paramValues = Object.keys(_values).map(key => _values[key]);

        const fn = typeof text == 'string' ? toFn(text) : text;
        const result = fn(...paramValues); //wirft einen Fehler, wenn invalide
        return result;
    }

    function toFn(text) {

        const _values = values('parsable');


        const paramKeys = Object.keys(_values);
        try {
            const codeNonString = 'return ' + text + ';';
            const fn = Function(...paramKeys, codeNonString);
            return fn;
        } catch (e) {
            try {
                const codeString = 'return `' + text + '`;';
                const fn = Function(...paramKeys, codeString);
                return fn;
            } catch (e) {
                console.log('code can not be parsed', codeNonString)
            }

        }
    }

    function addDependencies(expressionResult, name, elemid, bindingFn, ) {
        const fnText = expressionResult.expression ? expressionResult.expression.toString() : expressionResult.toString();

        const dependencies = globalCache.dependencyEvaluationStrategy(fnText, state);

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
                    bindingFn,
                    resultFn: toFn(expressionResult.expression ? expressionResult.expression : expressionResult),
                    resultFnRaw: expressionResult.expression ? expressionResult.expression : expressionResult,
                    expression: expressionResult
                }
            }
        };
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

    function watch(key, fn) {
        if (!watched[key])
            watched[key] = fn;
    }

    for (let _directive of globalCache.directives) {
        let directive = typeof _directive == 'function' ? _directive({ state, data: values() }) : _directive;
        directive = Object.assign({ name: _directive.name }, directive);

        if (directive.onChange) {
            const elements = initElements(directive.bindTo);

            for (let elem of elements) {
                const elemId = elem.dataset.id || randomId('id_');

                if (elem.dataset.id == null)
                    elem.dataset.id = elemId;

                let expressions = directive.expressions(elem);
                if (!Array.isArray(expressions))
                    expressions = [expressions];

                for (let expression of expressions) {
                    addDependencies(expression, 0, elemId, directive.onChange);
                }

            }
        }
    }

    const render = (state, prop, value) => {
        const toUpdate = cache.dependencies[prop] || [];
        for (let updateEntry of toUpdate) {
            const cacheUpdateEntry = cache.bindings[updateEntry];
            const elem = document.querySelector(`[data-id="${cacheUpdateEntry.elemid}"]`);
            const result = compute(cacheUpdateEntry.resultFn);

            if (cacheUpdateEntry.bindingFn)
                cacheUpdateEntry.bindingFn(elem, result, { values, property: prop, value, expression: cacheUpdateEntry.expression });
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
        cache
    }
};

function initElements(_elements) {
    let elements = _elements;

    if (typeof elements == 'function')
        elements = elements();

    if (elements == null)
        throw new Error('Registerconfig.bindTo returns null but should return a selector, element, Array of elements or function that returns one of these.');

    if (Array.isArray(elements))
        return elements;

    if (typeof elements == 'string')
        return document.querySelectorAll(elements);

    return [elements];
}

function directive(config) {

    globalCache.directives.push(config);
}

function dependencyEvaluationStrategy(fn) {
    if (fn == null)
        throw new Error('fn is null but must be a function;')

    globalCache.dependencyEvaluationStrategy = fn;

}

Dombee.directive = directive;
Dombee.dependencyEvaluationStrategyDefault = dependencyEvaluationStrategyDefault;
Dombee.dependencyEvaluationStrategy = dependencyEvaluationStrategy;

export { Dombee, directive, dependencyEvaluationStrategyDefault, dependencyEvaluationStrategy };