const globalCache = {
    directives: []
};

function Dombee(_state = {}) {

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
                console.log('code can not be parsed', codeNonString);
            }

        }
    }

    function addDependencies(expressionResult, name, elemid, keyprefix = "", bindingFn, ) {
        const fnText = expressionResult.expression ? expressionResult.expression.toString() : expressionResult.toString();
        Object.keys(state).forEach(key => {
            if (!fnText.match(new RegExp("\\b" + keyprefix + key + "\\b")))
                return;

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
                };
            }
        });
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
                    addDependencies(expression, 0, elemId, "", directive.onChange);
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

        render(state, key, state[key]);
    });

    return {
        state,
        values: values(),
        watch,
        cache
    }
}

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

directive({
    name: 'inputElementCheckboxes',
    bindTo: 'input[data-model][type="checkbox"]',
    expressions: elem => elem.dataset.model,
    onChange(elem, result, { property, value }) {
        if (value)
            elem.setAttribute('checked', 'checked');
        else
            elem.removeAttribute('checked');
    },
});

directive(function onRenderInputElementDefault() {
    return {
        bindTo: '[data-model]:not([type="radio"])',
        expressions: elem => elem.dataset.model,
        onChange(elem, result, { property, value }) {
            elem.value = value;
        },
    }
});

directive(function onRenderInputElementRadios() {
    return {
        bindTo: 'input[data-model][type="radio"]',
        expressions: elem => elem.dataset.model,
        onChange(elem, result, { property, value }) {
            if (elem.value == value)
                elem.setAttribute('checked', 'checked');
        },
    }
});

directive(function onRenderDataBind() {
    return {
        bindTo: '[data-bind]',
        expressions: elem => elem.dataset.bind,
        onChange(elem, result, state) {
            elem.innerHTML = result;
        },
    }
});

directive(function onRenderDataClass() {
    return {
        expressions: elem => elem.dataset.class,
        bindTo: '[data-class]',
        onChange(elem, result, state) {
            if (typeof result == 'object') {
                Object.keys(result).forEach(key => {
                    const hasClass = result[key];
                    if (hasClass)
                        elem.classList.add(key);
                    else
                        elem.classList.remove(key);
                });
            } else {
                elem.setAttribute('class', result);
            }
        },
    }
});

directive(function onRenderDataStyle() {
    return {
        bindTo: '[data-style]',
        expressions: elem => elem.dataset.style,
        onChange(elem, result, state) {
            if (typeof result == 'object') {
                Object.keys(result).forEach(key => {
                    elem.style[key] = result[key];
                });
            } else {
                elem.setAttribute('style', result);
            }
        }
    }
});

directive(function onRenderStyleXyz() {
    return {
        bindTo: () => {
            return Array.from(document.querySelectorAll('*')).filter(elem => {
                const hasStyleKey = Object.keys(elem.dataset).filter(key => key.startsWith('style.')).length > 0;
                return hasStyleKey;
            });
        },
        expressions: elem => {
            const expressions = Object.keys(elem.dataset).filter(key => key.startsWith('style.')).map(key => elem.dataset[key]);
            console.log(expressions);
            return expressions;
        },
        onChange(elem, result, { property }) {
            elem.style[property] = result;
        },
    }
});

directive(function onRenderClassXyz() {
    const boundElements = Array.from(document.querySelectorAll('*')).filter(elem => {
        const hasClassKey = Object.keys(elem.dataset).filter(key => key.startsWith('class.')).length > 0;
        return hasClassKey;
    });

    return {
        bindTo: boundElements,
        expressions: elem => {
            const expressions = Object.keys(elem.dataset).filter(key => key.startsWith('class.')).map(key => {
                return {
                    computation: elem.dataset[key],
                    classname: key.replace('class.', '')
                }
            });
            console.log(expressions);
            return expressions;
        },
        onChange(elem, result, { property, value, computation }) {
            if (result)
                elem.classList.add(computation.classname);
            else
                elem.classList.remove(computation.classname);
        },
    }
});

directive(function addDataModelEvents({ data, state }) {
    const allInputsNoCheckbox = document.querySelectorAll('[data-model]:not([type="checkbox"])');
    const allCheckboxex = document.querySelectorAll('input[data-model][type="checkbox"]');

    for (let elem of allInputsNoCheckbox) {
        elem.addEventListener('keyup', function() {
            const name = elem.dataset.model;
            state[name] = elem.value;
        });

        elem.addEventListener('change', function() {
            const name = elem.dataset.model;
            state[name] = elem.value;
        });
    }

    for (let elem of allCheckboxex) {
        elem.addEventListener('change', function() {
            const name = elem.dataset.model;
            state[name] = elem.checked;
        });
    }
});

directive(function onRenderDataShow() {
    return {
        bindTo: 'data-show',
        expressions: elem => elem.dataset.show,
        onChange(elem, result) {
            elem.style.display = result ? 'block' : 'none';
        },
    }
});

export default Dombee;
