var Dombee = (function (exports) {
    'use strict';

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

    const renderResultCache = new Cache();

    function reset() {
        exports.globalCache = {
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
                return renderResultCache(cacheId, () => compute(code, expressionTypes.map(exType => { return { key: exType, fn: exports.globalCache.expressionTypes[exType] } }), dm.values, dm.valuesStringified));
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

        for (let onload of exports.globalCache.events.onload) {
            onload({ cache, state: dm.state, $root });
        }

        function initConfig(config = {}) {
            if (config.data == undefined)
                config.data = {};

            return config;
        }



        function getExpressionTypes(directive) {
            if (!directive || !directive.expressionTypes)
                return exports.globalCache.defaultExpressionTypes;

            if (Array.isArray(directive.expressionTypes))
                return directive.expressionTypes;

            return [directive.expressionTypes]

        }

        function addDependencies(expressionResult = "", name, directive = {}, $elem) {
            const fnText = expressionResult.expression ? expressionResult.expression.toString() : expressionResult.toString();

            const dependencies = exports.globalCache.dependencyEvaluationStrategy(fnText, dm.state);
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
            let value = exports.globalCache.directivesObj[attrkey];

            if (value)
                return value;

            if (exports.globalCache.noDirectives[attrkey])
                return [];

            for (let key of Object.keys(exports.globalCache.directivesObj)) {
                if (attr.startsWith(key))
                    return exports.globalCache.directivesObj[key];
            }

            exports.globalCache.noDirectives[attrkey] = true;
            return [];

        }

        for (let directiveConfig of exports.globalCache.directives) {
            const directive = createDirective(directiveConfig, { $root, state: dm.state, dm });
            const key = directive.bindTo.toLowerCase();

            if (!exports.globalCache.directivesObj[key])
                exports.globalCache.directivesObj[key] = [];

            exports.globalCache.directivesObj[key].push(directive);
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
        exports.globalCache.events.onload.push(fn);
    }

    function directive(config) {
        exports.globalCache.directives.push(config);
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
        globalCache: exports.globalCache,
        reset,
        _id: randomId()
    });

    exports.Dombee = Dombee;
    exports.addExpressionType = addExpressionType;
    exports.addPlugin = addPlugin;
    exports.dependencyEvaluationStrategy = dependencyEvaluationStrategy;
    exports.dependencyEvaluationStrategyDefault = dependencyEvaluationStrategyDefault;
    exports.directive = directive;
    exports.expressionTypeJs = expressionTypeJs;
    exports.expressionTypeJsTemplateString = expressionTypeJsTemplateString;
    exports.onLoad = onLoad;
    exports.reset = reset;

    return exports;

}({}));
