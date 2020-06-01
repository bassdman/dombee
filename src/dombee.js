import { directive, Dombee, onLoad } from './dombee-core.js';

onLoad(function replaceHandlebars({ $root }) {
    $root.querySelectorAll('*').forEach($elem => {
        const innerText = [].reduce.call($elem.childNodes, function(a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '').trim();

        const found = [...innerText.matchAll(/{{.*?}}/g)];

        if (!found.length)
            return;

        const foundEntries = found.map(entry => {
            return {
                expression: entry[0].replace('{{', '').replace('}}', ''),
                raw: entry[0]
            }
        });

        let modifiedHTML = $elem.innerHTML;
        for (let foundEntry of foundEntries) {
            modifiedHTML = modifiedHTML.replace(foundEntry.raw, `<span data-interpolation="${foundEntry.expression}"></span>`)
        }

        $elem.innerHTML = modifiedHTML;
    });
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
        bindTo: 'data-interpolation',
        expressions: $elem => $elem.dataset.interpolation,
        onChange($elem, result, state) {
            $elem.innerText = result;
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
                })
            } else {
                $elem.setAttribute('class', result)
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
                })
            } else {
                $elem.setAttribute('style', result)
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
                $elem.classList.add(expression.classname)
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