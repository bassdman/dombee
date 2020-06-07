import { dependencyEvaluationStrategyDefault } from "../defaults.js";
import { throwErrorIf } from '../helpers/throwError';

export class DombeeModel {
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
    throwErrorIf(typeof data != 'object' || Array.isArray(data), `Error in DombeeModel(data,config): data is typeof${typeof data} but must be an object`, 'datainvalid:noobject')

    const dependencyEvaluationStrategy = config.dependencyEvaluationStrategy || dependencyEvaluationStrategyDefault;
    const dependencies = {};
    const proxyConfig = {
        set(target, property, value) {
            const proxiedValue = typeof value == 'object' ? new Proxy(value, proxyConfig) : value;

            target[property] = proxiedValue;

            if (config.beforeChange)
                config.beforeChange(property, value);

            if (!config.onChange)
                return true;

            config.onChange(target, property, proxiedValue);

            for (let dependency of dependencies[property] || []) {
                config.onChange(target, dependency, state[dependency]);
            }

            return true;
        },
        get(target, key) {
            if (key == 'isProxy')
                return true;
            const prop = target[key];
            if (typeof prop == 'undefined')
                return;
            if (!prop.isProxy && typeof prop === 'object')
                target[key] = new Proxy(prop, proxyConfig);
            return target[key];
        }
    };

    const state = new Proxy(data, proxyConfig);

    Object.keys(state).forEach(key => {

        if (typeof state[key] == 'function') {
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