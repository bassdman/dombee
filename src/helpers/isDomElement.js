export function isDomElement(elemToProove) {
    try {
        // var elem = getDocument().createElement('div');
        return elemToProove.tagName != null;
    } catch (e) {
        return false;
    }
}