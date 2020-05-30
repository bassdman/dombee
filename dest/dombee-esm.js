function dependencyEvaluationStrategyDefault(fn, state) {
    const fnText = typeof fn == 'function' ? fn.toString() : fn;
    return Object.keys(state).filter(key => {
        return fnText.match(new RegExp("\\b" + key + "\\b"));
    });
}

function expressionTypeJs(text, values) {
    const paramKeys = Object.keys(values);
    const codeNonString = 'return ' + text + ';';
    const fn = Function(...paramKeys, codeNonString);
    return fn;
}

function expressionTypeJsTemplateString(text, values) {
    const paramKeys = Object.keys(values);
    const codeString = 'return `' + text + '`;';
    const fn = Function(...paramKeys, codeString);
    return fn;
}

function createDirective(config, { state, values }) {
    if (config == null)
        throw new Error('Dombee.directive(config) failed. The first parameter must be a config object or function, but is null.');
    let directive = config;
    /*
        When the directive is wrapped in a function, unwrap this function
        Example: Dombee.directive(function testFn(){
            return {
                onChange: () => { //do sth },
                expressions: ['expression1','expression2']
            }
        })
        will result in
        {
            name: 'testFn'
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
    /*
        Initialize the elements attribute
    */


    return directive;
}

function randomId(prefix = "") {

    return prefix + Math.random().toString(36).substring(2, 15);
}

function isDomElement(elemToProove) {
    try {
        return elemToProove.tagName != null;
    } catch (e) {
        return false;
    }
}

var Cache_1 = function(_config = {}) {
    let config = _config;

    const cacheFn = function(key, value) {
        if (value && !key)
            throw new Error('Error in Cache: key is null but value is defined. cache(null,"value"). But it should be: cache(), cache(key),cache(key,value)');

        if (key && config[key])
            return config[key];

        if (value) {
            if (typeof value == 'function')
                config[key] = value();
            else
                config[key] = value;
        }

        if (key)
            return config[key];

        return config;
    };

    cacheFn.reset = function() {
        config = {};
    };
    return cacheFn;
};

let globalCache;

const renderResultCache = new Cache_1();

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

    const cache = {
        _localDumbeeCache: true,
        bindings: {},
        dependencies: {}
    };

    config = initConfig(config);
    const $root = initRoot(config);

    const state = new Proxy(config.data, {
        set(target, property, value) {
            target[property] = value;
            renderResultCache.reset();
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
        onload({ cache, state, $root });
    }

    function initConfig(config = {}) {
        if (config.data == undefined)
            config.data = {};

        return config;
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

    function addDependencies(expressionResult = "", name, elemid, directive = {}, $elem) {
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
                    name,
                    $elem,
                    onChange: directive.onChange,
                    resultFn: toFn(expressionResult.expression ? expressionResult.expression : expressionResult, expressionTypes),
                    resultFnRaw: expressionResult.expression ? expressionResult.expression : expressionResult,
                    expression: expressionResult,
                    expressionTypes
                };
            }
        }    }

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
        const directive = createDirective(directiveConfig, { $root, state, values });
        const key = directive.bindTo.toLowerCase();

        if (!globalCache.directivesObj[key])
            globalCache.directivesObj[key] = [];

        globalCache.directivesObj[key].push(directive);
    }
    $root.querySelectorAll('*').forEach($elem => {
        if (!$elem.dataset)
            $elem.dataset = {};

        const elemId = randomId('id');

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

                        addDependencies(expression, 0, elemId, directive, $elem);
                    }
                }
            }
        }
    });

    const render = (state, prop, value) => {
        const toUpdate = cache.dependencies[prop] || [];

        for (let updateEntry of toUpdate) {
            const cacheUpdateEntry = cache.bindings[updateEntry];
            const $elem = cacheUpdateEntry.$elem;
            const result = renderResultCache(cacheUpdateEntry.expression, () => compute(cacheUpdateEntry.resultFn, cacheUpdateEntry.expressionTypes));

            if (cacheUpdateEntry.onChange)
                cacheUpdateEntry.onChange($elem, result, { values, property: prop, value, expression: cacheUpdateEntry.expression, $root });
        }
    };

    Object.keys(state).forEach(key => {
        if (typeof state[key] == 'function') {
            addDependencies(state[key], key);
        }

        render(state, key, state[key]);
    });

    return {
        state,
        values: values(),
        watch,
        cache,
        $root
    }
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

directive({
    name: 'inputElementCheckboxes',
    bindTo: 'data-model',
    expressions: $elem => {
        if (!$elem.tagName == 'input')
            return;

        if ($elem.getAttribute("type") != 'checkbox')
            return;

        return $elem.dataset.model;
    },
    onChange($elem, result, { property, value }) {
        if (value)
            $elem.setAttribute('checked', 'checked');
        else
            $elem.removeAttribute('checked');
    },
});

directive(function inputElementDefault() {
    return {
        bindTo: 'data-model',
        expressions: $elem => {
            if (!$elem.tagName == 'input')
                return;

            if ($elem.getAttribute("type") == 'radio')
                return;

            return $elem.dataset.model;
        },
        onChange($elem, result, { property, value }) {
            $elem.value = value;
        },
    }
});

directive(function inputElementRadios() {
    return {
        bindTo: 'data-model',
        expressions: $elem => {
            if (!$elem.tagName == 'input')
                return;

            if ($elem.getAttribute("type") !== 'radio')
                return;

            return $elem.dataset.model;
        },
        onChange($elem, result, { property, value }) {
            if ($elem.value == value)
                $elem.setAttribute('checked', 'checked');
        },
    }
});

directive(function dataHtml() {
    return {
        bindTo: 'data-html',
        expressions: $elem => $elem.dataset.html,
        onChange($elem, result, state) {
            $elem.innerHTML = result;
        },
    }
});

directive(function dataText() {
    return {
        bindTo: 'data-text',
        expressions: $elem => $elem.dataset.text,
        onChange($elem, result, state) {
            $elem.innerText = result;
        },
    }
});

directive(function dataBind() {
    return {
        bindTo: 'data-bind',
        expressions: $elem => {
            const expressions = Object.keys($elem.attributes).filter(i => $elem.attributes[i].name.startsWith('data-bind:') || $elem.attributes[i].name.startsWith(':')).map(i => {
                const attributeName = $elem.attributes[i].name;
                return {
                    expression: $elem.getAttribute(attributeName),
                    attributeName: attributeName.replace('data-bind:', '').replace(':', '')
                }
            });
            return expressions;
        },
        onChange($elem, result, { expression }) {
            $elem.setAttribute(expression.attributeName, result);
        },
    }
});

directive(function dataClass() {
    return {
        bindTo: 'data-class',
        expressions: $elem => $elem.dataset.class,
        onChange($elem, result, state) {
            if (typeof result == 'object') {
                Object.keys(result).forEach(key => {
                    const hasClass = result[key];
                    if (hasClass)
                        $elem.classList.add(key);
                    else
                        $elem.classList.remove(key);
                });
            } else {
                $elem.setAttribute('class', result);
            }
        },
    }
});

directive(function dataStyle() {
    return {
        bindTo: 'data-style',
        expressions: $elem => $elem.dataset.style,
        onChange($elem, result, state) {
            if (typeof result == 'object') {
                Object.keys(result).forEach(key => {
                    $elem.style[key] = result[key];
                });
            } else {
                $elem.setAttribute('style', result);
            }
        }
    }
});

directive(function styleXyz() {
    return {
        bindTo: 'data-style:',
        expressions: $elem => {
            const expressions = Object.keys($elem.dataset).filter(key => key.startsWith('style:')).map(key => $elem.dataset[key]);
            return expressions;
        },
        onChange($elem, result, { property }) {
            $elem.style[property] = result;
        },
    }
});

directive(function classXyz() {
    return {
        bindTo: 'data-class:',
        expressions: $elem => {
            const expressions = Object.keys($elem.dataset).filter(key => key.startsWith('class:')).map(key => {
                return {
                    expression: $elem.dataset[key],
                    classname: key.replace('class:', '')
                }
            });
            return expressions;
        },
        onChange($elem, result, { property, value, expression }) {
            if (result)
                $elem.classList.add(expression.classname);
            else
                $elem.classList.remove(expression.classname);
        },
    }
});

directive(function dataShow() {
    return {
        bindTo: 'data-show',
        expressions: $elem => $elem.dataset.show,
        onChange($elem, result) {
            $elem.style.display = result ? 'block' : 'none';
        },
    }
});

onLoad(function addDataModelEvents({ state, $root }) {
    const allInputsNoCheckbox = $root.querySelectorAll('[data-model]:not([type="checkbox"])');
    const allCheckboxex = $root.querySelectorAll('input[data-model][type="checkbox"]');

    for (let $elem of allInputsNoCheckbox) {
        $elem.addEventListener('keyup', function() {
            const name = $elem.dataset.model;
            state[name] = $elem.value;
        });

        $elem.addEventListener('change', function() {
            const name = $elem.dataset.model;
            state[name] = $elem.value;
        });
    }

    for (let $elem of allCheckboxex) {
        $elem.addEventListener('change', function() {
            const name = $elem.dataset.model;
            state[name] = $elem.checked;
        });
    }
});

export default Dombee;
