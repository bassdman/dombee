import { registerDirective, Dombee } from './dombee-core.js';




registerDirective(function onRenderInputElementCheckboxes() {
    return {
        bindTo: 'input[data-model][type="checkbox"]',
        computations: elem => elem.dataset.model,
        onRender(elem, result, { property, value }) {
            if (value)
                elem.setAttribute('checked', 'checked');
            else
                elem.removeAttribute('checked');
        },
    }
});

registerDirective(function onRenderInputElementDefault() {
    return {
        bindTo: '[data-model]:not([type="radio"])',
        computations: elem => elem.dataset.model,
        onRender(elem, result, { property, value }) {
            elem.value = value;
        },
    }
});

registerDirective(function onRenderInputElementRadios() {
    return {
        bindTo: 'input[data-model][type="radio"]',
        computations: elem => elem.dataset.model,
        onRender(elem, result, { property, value }) {
            if (elem.value == value)
                elem.setAttribute('checked', 'checked');
        },
    }
});

registerDirective(function onRenderDataBind() {
    return {
        bindTo: '[data-bind]',
        computations: elem => elem.dataset.bind,
        onRender(elem, result, state) {
            elem.innerHTML = result;
        },
    }
});

registerDirective(function onRenderDataClass() {
    return {
        computations: elem => elem.dataset.class,
        bindTo: '[data-class]',
        onRender(elem, result, state) {
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

registerDirective(function onRenderDataStyle() {
    return {
        bindTo: '[data-style]',
        computations: elem => elem.dataset.style,
        onRender(elem, result, state) {
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

registerDirective(function onRenderStyleXyz() {
    return {
        bindTo: () => {
            return Array.from(document.querySelectorAll('*')).filter(elem => {
                const hasStyleKey = Object.keys(elem.dataset).filter(key => key.startsWith('style.')).length > 0;
                return hasStyleKey;
            });
        },
        computations: elem => {
            const computations = Object.keys(elem.dataset).filter(key => key.startsWith('style.')).map(key => elem.dataset[key]);
            console.log(computations);
            return computations;
        },
        onRender(elem, result, { property }) {
            elem.style[property] = result;
        },
    }
});

registerDirective(function onRenderClassXyz() {
    const boundElements = Array.from(document.querySelectorAll('*')).filter(elem => {
        const hasClassKey = Object.keys(elem.dataset).filter(key => key.startsWith('class.')).length > 0;
        return hasClassKey;
    });

    return {
        bindTo: boundElements,
        computations: elem => {
            const computations = Object.keys(elem.dataset).filter(key => key.startsWith('class.')).map(key => {
                return {
                    computation: elem.dataset[key],
                    classname: key.replace('class.', '')
                }
            });
            console.log(computations);
            return computations;
        },
        onRender(elem, result, { property, value, computation }) {
            if (result)
                elem.classList.add(computation.classname)
            else
                elem.classList.remove(computation.classname);
        },
    }
});

registerDirective(function addDataModelEvents({ state }) {
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

registerDirective(function onRenderDataShow() {
    return {
        bindTo: 'data-show',
        computations: elem => elem.dataset.show,
        onRender(elem, result) {
            elem.style.display = result ? 'block' : 'none';
        },
    }
});

/* Ende Der Bereich wird ausgelagert
 */
export default Dombee;