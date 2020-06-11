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

let _errorMode = 'production';

function throwError(message, identifier) {
    if (_errorMode == 'development')
        throw identifier;

    throw new Error(message);
}

function throwErrorIf(condition, message, identifier) {
    if (condition)
        throwError(message, identifier);
}

function errorMode(errorMode) {
    _errorMode = errorMode;
}

function createDirective(config, { state, values }) {
    throwErrorIf(config == null, 'Dombee.directive(config) failed. The first parameter must be a config object or function, but is null.', 'directive-config=null');
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
        throwErrorIf(directive == null, `Dombee.directive(config) failed. First parameter is a function (${config}) but it returns null. Did you forget to return the configuration?`, 'directiveIsNull');
        directive.name = config.name;
    }

    throwErrorIf(directive.onChange == null, 'Dombee.directive(config) failed. Your directive config needs property "onChange" to be initialized successfully.', 'directive.onChangeIsNull');

    throwErrorIf(typeof directive.onChange !== 'function', 'Dombee.directive(config) failed. config.onChange must be a function.', 'directive.onChangeNoFunction');

    throwErrorIf(directive.expressions == null, 'Dombee.directive(config) failed. config.expressions must be a function. But it is null.', 'directive.expressionsIsNull');

    throwErrorIf(typeof directive.expressions != 'function', `Dombee.directive(config) failed. config.expressions must be a function. But it is typeof ${typeof config.expressions}`, 'directive.expressionsIsNotAFunction');

    /*
        Initialize the elements attribute
    */
    if (directive.bindTo == null)
        directive.bindTo = '*';

    throwErrorIf(typeof directive.bindTo != 'string', `Dombee.directive(config) failed. config.bindTo must be a string. But it is typeof ${typeof config.bindTo}`, 'directive.bindToNotString');


    return directive;
}

function compute(text = '', expressionTypes, values, valuesParsable) {
    const paramValues = Object.values(values);

    const fn = typeof text == 'string' ? toFn(text, expressionTypes, valuesParsable) : text;
    const result = fn(...paramValues); //wirft einen Fehler, wenn invalide
    return result;
}

function toFn(text, expressionTypes, values) {

    for (let expressionType of expressionTypes) {
        try {
            if (expressionType.fn == null)
                throw `Expressiontype "${expressionType.key}" does not exist. If the name is correct, please add it with "Dombee.addExpressionType('${expressionTypeKey}', function(text,values){/*your code here*/})"`;

            return expressionType.fn(text, values);
        } catch (e) {
            if (typeof e == 'string')
                throw new Error(e);
            // This expressionType did not succeed. Maybe it is another one.
            // Try next one
        }
    }

    //no expressiontype succeeded, throw error;
    throw new Error(`Expression "${text}" can not be parsed.`);
}

function iterateRecursive(obj, handler, onlyLeafes = true) {
    iterateInternal(obj, handler, onlyLeafes);
}

function iterateInternal(obj, handler, onlyLeafes = true, rootKey = []) {
    Object.keys(obj).forEach(key => {

        if (typeof obj[key] !== 'object' && onlyLeafes)
            handler(obj, key, obj[key], rootKey.join('.'));

        if (typeof obj[key] === 'object') {
            iterateInternal(obj[key], handler, onlyLeafes, [...rootKey, key]);
        }
    });
}

class DombeeModel {
    constructor(data, config) {
        this.state = init(data, config);
    }

    get values() {
        return values(this.state);
    }

    get valuesStringified() {
        return values(this.state, 'stringified');
    }
}

function init(data = {}, config = {}) {
    throwErrorIf(typeof data != 'object' || Array.isArray(data), `Error in DombeeModel(data,config): data is typeof${typeof data} but must be an object`, 'datainvalid:noobject');

    const dependencyEvaluationStrategy = config.dependencyEvaluationStrategy || dependencyEvaluationStrategyDefault;
    const dependencies = {};
    const proxyConfig = {
        set(target, property, value) {
            const proxiedValue = value;

            target[property] = proxiedValue;

            if (config.beforeChange)
                config.beforeChange(property, value);

            if (!config.onChange)
                return true;

            config.onChange(target, property, proxiedValue);

            const rootKey = getRootKey(target.__rootKey, property).split('.')[0];
            for (let dependency of dependencies[rootKey] || []) {
                config.onChange(target, dependency, state[dependency]);
            }

            return true;
        },
        get(target, key) {
            let value = target[key];
            if (value !== undefined) {
                if (typeof value === 'object') {
                    value.__rootKey = getRootKey(target.__rootKey, key);
                    return new Proxy(value, proxyConfig)
                }
                return value;
            }
            return new Proxy({}, proxyConfig)
        }
    };

    const state = new Proxy(data, proxyConfig);

    iterateRecursive(state, (state, key, value, rootKey) => {
        if (typeof value == 'function') {
            const fn = state[key];
            const foundDependencies = dependencyEvaluationStrategy(fn, state).filter(dependency => dependency != key);

            for (let dependency of foundDependencies) {
                if (!dependencies[dependency])
                    dependencies[dependency] = [];

                dependencies[dependency].push(key);
            }
        }
    });

    return state;
}

function values(state, stringified) {
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

        if (typeof value == 'string' && stringified)
            valueText = `'${value}'`;

        if (typeof value == 'object' && stringified)
            valueText = JSON.stringify(value);

        retObj[key] = valueText;
    });

    return retObj;
}

function getRootKey(target, current) {
    if (target)
        return target + '.' + current;
    else
        return current;
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

function Cache(_config = {}) {
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
}

let globalCache;

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

    const cache = {
        _localDumbeeCache: true,
        bindings: {},
        dependencies: {},
    };

    config = initConfig(config);

    errorMode(Dombee.errorMode || 'production');

    const $root = initRoot(config);

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
    });

    for (let onload of globalCache.events.onload) {
        onload({ cache, state: dm.state, $root });
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

        const dependencies = globalCache.dependencyEvaluationStrategy(fnText, dm.state);
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
                };
            }
        }    }

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
        const directive = createDirective(directiveConfig, { $root, state: dm.state, dm });
        const key = directive.bindTo.toLowerCase();

        if (!globalCache.directivesObj[key])
            globalCache.directivesObj[key] = [];

        globalCache.directivesObj[key].push(directive);
    }
    $root.querySelectorAll('*').forEach($elem => {
        if (!$elem.dataset)
            $elem.dataset = {};

        const elementDirectives = getDirectivesFromCache('*');
        for (let directive of elementDirectives) {
            if (directive.onElemLoad)
                directive.onElemLoad($elem, { directive, state: dm.state, values: dm.values });

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
    });

    function renderRecursive(obj) {
        Object.keys(obj).forEach(key => {
            render(dm.state, key, obj[key]);
        });
    }

    renderRecursive(dm.state);

    dm.cache = cache;
    dm.$root = $root;
    dm.watch = watch;

    return dm;
}

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

directive(function dataInterpolation() {
    return {
        expressionTypes: 'js',
        bindTo: '*',
        onElemLoad($elem) {
            $elem.dombeeTemplates = Array.from($elem.childNodes).map($node => {
                if ($node.nodeType == 3)
                    return $node.nodeValue;
                return null;
            });
        },
        expressions: $elem => {
            const interpolations = [];
            for (let child of $elem.childNodes) {
                if (child.nodeType != 3)
                    continue;

                if (!child.nodeValue.includes('{{'))
                    continue;

                const found = [...child.nodeValue.matchAll(/{{.*?}}/g)];
                const foundEntries = found.map(entry => {
                    return {
                        expression: entry[0].replace('{{', '').replace('}}', ''),
                        raw: entry[0]
                    }
                });
                interpolations.push(...foundEntries);
            }
            $elem.dombeeInterpolations = interpolations;
            return interpolations;
        },
        onChange($elem, result, { compile }) {
            for (let i in $elem.childNodes) {
                const child = $elem.childNodes[i];

                if (child.nodeType != 3)
                    continue;

                let template = $elem.dombeeTemplates[i];

                if (!template.includes('{{'))
                    continue;

                const found = [...template.matchAll(/{{(.*?)}}/g)];
                for (let foundEntry of found) {
                    const code = foundEntry[1];
                    const compiled = compile(code, code, ['js']);
                    template = template.replace(foundEntry[0], compiled);
                }

                child.nodeValue = template;
            }
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
            $elem.textContent = result;
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

directive(function dataShow() {
    return {
        bindTo: 'data-show',
        expressions: $elem => $elem.dataset.show,
        onChange($elem, result) {
            $elem.style.display = result ? 'block' : 'none';
        },
    }
});

directive(function addDataModelEvents() {
    return {
        bindTo: '*',
        expressions: $elem => {},
        onElemLoad($elem, { state }) {
            if (!$elem.dataset.model)
                return;

            const isCheckbox = $elem.tagName == 'INPUT' && $elem.getAttribute('type') == 'checkbox';

            if (isCheckbox) {
                $elem.addEventListener('change', function() {
                    const name = $elem.dataset.model;
                    state[name] = $elem.checked;
                });
            } else {
                $elem.addEventListener('keyup', function() {
                    const name = $elem.dataset.model;
                    state[name] = $elem.value;
                });

                $elem.addEventListener('change', function() {
                    const name = $elem.dataset.model;
                    state[name] = $elem.value;
                });
            }
        },
        onChange($elem, result) {

        },
    }
});

export default Dombee;
