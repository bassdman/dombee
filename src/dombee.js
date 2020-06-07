import { directive, Dombee, onLoad } from './dombee-core.js';

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

                child.nodeValue = template
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
                $elem.classList.add(expression.classname)
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