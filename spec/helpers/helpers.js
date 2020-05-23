const { JSDOM } = require("jsdom");
const { Dombee: DombeeCore } = require('../../dest/dombee-core-cjs.js');
const { Dombee } = require('../../dest/dombee-cjs.js');

const defaultHTML = "<!DOCTYPE html><html><body><p class='abc'>Hello world</p></body></html>";

function getDombeeInstance(html = defaultHTML) {
    const dom = new JSDOM(html);
    Dombee.document = dom.window.document;
    return Dombee;
}

function getDombeeCoreInstance(html = defaultHTML) {
    const dom = new JSDOM(html);
    DombeeCore.document = dom.window.document;
    return DombeeCore;
}

function domElement() {
    return dom.window.document.createElement('div');
}
exports.getDombeeInstance = getDombeeInstance;
exports.getDombeeCoreInstance = getDombeeCoreInstance;
exports.domElement = domElement;