import { directive, Dombee } from './dombee-core.js';




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
                })
            } else {
                elem.setAttribute('class', result)
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
                })
            } else {
                elem.setAttribute('style', result)
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
                elem.classList.add(computation.classname)
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
window.Dombee = Dombee;