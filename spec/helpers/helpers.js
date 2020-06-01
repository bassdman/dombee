const { JSDOM } = require("jsdom");
const { Dombee: DombeeCore } = require('../../dest/dombee-core-cjs.js');
const { Dombee } = require('../../dest/dombee-cjs.js');

const defaultHTML = "<!DOCTYPE html><html><body id='$root'><p class='abc'>Hello world</p></body></html>";

function getDombeeInstance(html = defaultHTML) {
    const dom = new JSDOM(html);
    Dombee.documentMock = dom.window.document;
    return Dombee;
}

function getDombeeCoreInstance(html = defaultHTML) {
    const dom = new JSDOM(html);
    DombeeCore.documentMock = dom.window.document;
    DombeeCore.errorMode = 'development';
    return DombeeCore;
}

function domElement() {
    return dom.window.document.createElement('div');
}

function isDomElement(elemToProove) {
    try {
        return elemToProove.tagName != null;
    } catch (e) {
        return false;
    }
}

function textDirective() {
    return {
        bindTo: 'data-text',
        expressions: $elem => $elem.dataset.text,
        onChange($elem, result, state) {
            $elem.innerText = result;
        },
    }
};

exports.getDombeeInstance = getDombeeInstance;
exports.getDombeeCoreInstance = getDombeeCoreInstance;
exports.domElement = domElement;
exports.isDomElement = isDomElement;
exports.textDirective = textDirective;