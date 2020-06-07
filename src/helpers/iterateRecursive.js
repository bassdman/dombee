export function iterateRecursive(obj, handler, onlyLeafes = true) {
    iterateInternal(obj, handler, onlyLeafes);
}

function iterateInternal(obj, handler, onlyLeafes = true, rootKey = []) {
    Object.keys(obj).forEach(key => {

        if (typeof obj[key] !== 'object' && onlyLeafes)
            handler(obj, key, obj[key], rootKey.join('.'));

        if (typeof obj[key] === 'object') {
            iterateInternal(obj[key], handler, onlyLeafes, [...rootKey, key])
        }
    })
}