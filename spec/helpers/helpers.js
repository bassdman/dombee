const { JSDOM } = require("jsdom");
const { instance } = require('../../dest/dombee-core-cjs.js');

const defaultHTML = "<!DOCTYPE html><html><body><p>Hello world</p></body></html>";
const dom = new JSDOM(defaultHTML);

function getDombeeInstance(html = defaultHTML) {
    const dombeeInstance = instance();
    dombeeInstance.document = dom.window.document;
    return dombeeInstance;
}

function domElement() {
    return dom.window.document.createElement('div');
}
exports.getDombeeInstance = getDombeeInstance;
exports.domElement = domElement;