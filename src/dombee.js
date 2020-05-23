import { directive, Dombee, onLoad } from './dombee-core.js';




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

directive(function inputElementDefault() {
    return {
        bindTo: '[data-model]:not([type="radio"])',
        expressions: elem => elem.dataset.model,
        onChange(elem, result, { property, value }) {
            elem.value = value;
        },
    }
});

directive(function inputElementRadios() {
    return {
        bindTo: 'input[data-model][type="radio"]',
        expressions: elem => elem.dataset.model,
        onChange(elem, result, { property, value }) {
            if (elem.value == value)
                elem.setAttribute('checked', 'checked');
        },
    }
});

directive(function dataHtml() {
    return {
        bindTo: '[data-html]',
        expressions: elem => elem.dataset.html,
        onChange(elem, result, state) {
            elem.innerHTML = result;
        },
    }
});

directive(function dataText() {
    return {
        bindTo: '[data-text]',
        expressions: elem => elem.dataset.text,
        onChange(elem, result, state) {
            elem.innerText = result;
        },
    }
});

directive(function dataBind() {
    return {
        bindTo: () => {
            return Array.from(document.querySelectorAll('*')).filter(elem => {
                const hasBindAttribute = Object.keys(elem.attributes).filter(i => {
                    const attributeName = elem.attributes[i].name;
                    return attributeName.startsWith('data-bind:') || attributeName.startsWith(':');
                }).length > 0;
                return hasBindAttribute;
            });
        },
        expressions: elem => {
            const expressions = Object.keys(elem.attributes).filter(i => elem.attributes[i].name.startsWith('data-bind:') || elem.attributes[i].name.startsWith(':')).map(i => {
                const attributeName = elem.attributes[i].name;
                return {
                    expression: elem.getAttribute(attributeName),
                    attributeName: attributeName.replace('data-bind:', '').replace(':', '')
                }
            });
            return expressions;
        },
        onChange(elem, result, { expression }) {
            elem.setAttribute(expression.attributeName, result);
        },
    }
});

directive(function dataClass() {
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
                })
            } else {
                elem.setAttribute('class', result)
            }
        },
    }
});

directive(function dataStyle() {
    return {
        bindTo: '[data-style]',
        expressions: elem => elem.dataset.style,
        onChange(elem, result, state) {
            if (typeof result == 'object') {
                Object.keys(result).forEach(key => {
                    elem.style[key] = result[key];
                })
            } else {
                elem.setAttribute('style', result)
            }
        }
    }
});

directive(function styleXyz() {
    return {
        bindTo: () => {
            return Array.from(document.querySelectorAll('*')).filter(elem => {
                const hasStyleKey = Object.keys(elem.dataset).filter(key => key.startsWith('style:')).length > 0;
                return hasStyleKey;
            });
        },
        expressions: elem => {
            const expressions = Object.keys(elem.dataset).filter(key => key.startsWith('style:')).map(key => elem.dataset[key]);
            return expressions;
        },
        onChange(elem, result, { property }) {
            elem.style[property] = result;
        },
    }
});

directive(function classXyz() {
    const boundElements = Array.from(document.querySelectorAll('*')).filter(elem => {
        const hasClassKey = Object.keys(elem.dataset).filter(key => key.startsWith('class:')).length > 0;
        return hasClassKey;
    });

    return {
        bindTo: boundElements,
        expressions: elem => {
            const expressions = Object.keys(elem.dataset).filter(key => key.startsWith('class:')).map(key => {
                return {
                    expression: elem.dataset[key],
                    classname: key.replace('class:', '')
                }
            });
            return expressions;
        },
        onChange(elem, result, { property, value, expression }) {
            if (result)
                elem.classList.add(expression.classname)
            else
                elem.classList.remove(expression.classname);
        },
    }
});

directive(function dataShow() {
    return {
        bindTo: '[data-show]',
        expressions: elem => elem.dataset.show,
        onChange(elem, result) {
            elem.style.display = result ? 'block' : 'none';
        },
    }
});

onLoad(function addDataModelEvents({ state }) {
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

export default Dombee;