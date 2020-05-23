import { dependencyEvaluationStrategyDefault, expressionTypeJs, expressionTypeJsTemplateString } from "./defaults.js";
import { createDirective } from './partials/createDirective';

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
export let globalCache = cloneDeep(initialGlobalCache);


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

    for (let directiveConfig of globalCache.directives) {

        const directive = createDirective(directiveConfig, { document: getDocument(), state, values });

        for (let elem of directive.elements) {
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

function directive(config) {
    globalCache.directives.push(config);
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