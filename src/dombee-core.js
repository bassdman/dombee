import { dependencyEvaluationStrategyDefault, expressionTypeJs, expressionTypeJsTemplateString } from "./defaults.js";
import { createDirective } from './partials/createDirective';
import { compute } from './partials/compute';
import { throwErrorIf, errorMode } from './helpers/throwError';
import { DombeeModel } from './partials/DombeeModel';


import { randomId } from "./helpers/randomId.js";
import { isDomElement } from "./helpers/isDomElement";

import { Cache } from './helpers/Cache.js';

export let globalCache;

const renderResultCache = new Cache();

function reset() {
    globalCache = {
        directives: [],
        directivesObj: {},
        noDirectives: {},
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
    renderResultCache.reset();
}

function initRoot(config) {
    const _document = Dombee.documentMock || document;

    let $rootElement = _document.createElement('div');

    if (isDomElement(config.bindTo))
        $rootElement = config.bindTo;

    if (config.bindTo)
        $rootElement = _document.querySelector(config.bindTo);

    if (config.template)
        $rootElement.innerHTML = config.template;

    return $rootElement;
}


function Dombee(config) {

    const watched = {};

    const cache = {
        _localDumbeeCache: true,
        bindings: {},
        dependencies: {},
        stateDependencies: {}
    };

    config = initConfig(config);

    errorMode(Dombee.errorMode || 'production');

    const $root = initRoot(config)

    const render = (state, prop, value) => {
        function compile(code = "", cacheKey, expressionTypes) {
            const cacheId = cacheKey || code.toString();
            return renderResultCache(cacheId, () => compute(code, expressionTypes.map(exType => { return { key: exType, fn: globalCache.expressionTypes[exType] } }), dm.values, dm.valuesStringified));
        }
        const toUpdate = cache.dependencies[prop] || [];

        for (let updateEntry of toUpdate) {
            const cacheUpdateEntry = cache.bindings[updateEntry];
            const $elem = cacheUpdateEntry.$elem;
            const result = compile(cacheUpdateEntry.resultFn, cacheUpdateEntry.expression, cacheUpdateEntry.expressionTypes);

            if (cacheUpdateEntry.onChange)
                cacheUpdateEntry.onChange($elem, result, { values: dm.values, property: prop, value, expression: cacheUpdateEntry.expression, $root, compile });
        }
    };

    const dm = new DombeeModel(config.data, {
        beforeChange() { renderResultCache.reset(); },
        onChange: render,
    })
    const state = dm.state;

    for (let onload of globalCache.events.onload) {
        onload({ cache, state, $root });
    }

    function initConfig(config = {}) {
        if (config.data == undefined)
            config.data = {};

        return config;
    }



    function getExpressionTypes(directive) {
        if (!directive || !directive.expressionTypes)
            return globalCache.defaultExpressionTypes;

        if (Array.isArray(directive.expressionTypes))
            return directive.expressionTypes;

        return [directive.expressionTypes]

    }

    function addDependencies(expressionResult = "", name, directive = {}, $elem) {
        const fnText = expressionResult.expression ? expressionResult.expression.toString() : expressionResult.toString();

        const dependencies = globalCache.dependencyEvaluationStrategy(fnText, state);
        const expressionTypes = getExpressionTypes(directive);
        const matchid = randomId('id');

        for (let key of dependencies) {

            if (!cache.dependencies[key]) {
                cache.dependencies[key] = [];
            }

            if (key !== name) {
                cache.dependencies[key].push(matchid);
                cache.bindings[matchid] = {
                    name,
                    $elem,
                    onChange: directive.onChange,
                    resultFn: expressionResult.expression ? expressionResult.expression : expressionResult,
                    expressionTypes,
                    expression: expressionResult,
                    expressionTypes
                }
            }
        };
    }

    function watch(key, fn) {
        if (!watched[key])
            watched[key] = fn;
    }

    function getDirectivesFromCache(attr) {
        const attrkey = attr.toLowerCase();
        let value = globalCache.directivesObj[attrkey];

        if (value)
            return value;

        if (globalCache.noDirectives[attrkey])
            return [];

        for (let key of Object.keys(globalCache.directivesObj)) {
            if (attr.startsWith(key))
                return globalCache.directivesObj[key];
        }

        globalCache.noDirectives[attrkey] = true;
        return [];

    }

    for (let directiveConfig of globalCache.directives) {
        const directive = createDirective(directiveConfig, { $root, state, dm });
        const key = directive.bindTo.toLowerCase();

        if (!globalCache.directivesObj[key])
            globalCache.directivesObj[key] = [];

        globalCache.directivesObj[key].push(directive)
    }
    $root.querySelectorAll('*').forEach($elem => {
        if (!$elem.dataset)
            $elem.dataset = {};

        const elementDirectives = getDirectivesFromCache('*');
        for (let directive of elementDirectives) {
            if (directive.onElemLoad)
                directive.onElemLoad($elem, { directive, state, values: dm.values });

            let expressions = directive.expressions($elem);

            if (expressions == null)
                continue;

            if (!Array.isArray(expressions))
                expressions = [expressions];

            for (let expression of expressions) {
                if (expression) {

                    addDependencies(expression, 0, directive, $elem);
                }
            }
        }

        for (let attr of $elem.attributes) {
            const directives = getDirectivesFromCache(attr.name);

            for (let directive of directives) {
                let expressions = directive.expressions($elem);

                if (expressions == null)
                    continue;

                if (!Array.isArray(expressions))
                    expressions = [expressions];

                for (let expression of expressions) {
                    if (expression) {

                        addDependencies(expression, 0, directive, $elem);
                    }
                }
            }
        }
    })

    function renderRecursive(obj) {
        Object.keys(obj).forEach(key => {
            render(state, key, obj[key])
        });
    }

    renderRecursive(state)



    return {
        state,
        values: dm.values,
        watch,
        cache,
        $root
    }
};


function dependencyEvaluationStrategy(fn) {
    if (fn == null)
        throw new Error('fn is null but must be a function;')

    Dombee.dependencyEvaluationStrategy = fn;
}

function addExpressionType(name, fn) {
    throwErrorIf(name == null, 'addExpressionType(name,fn) failed.  Name is undefined', 'addExpressionTypeNameUndefined');
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

function directive(config) {
    globalCache.directives.push(config);
}

reset();

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