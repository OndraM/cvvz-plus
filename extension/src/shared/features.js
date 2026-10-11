const FEATURES = [];

// A feature is one self-contained adjustment of the site, in the folder of the page it changes:
// src/<page>/features/<name>.js, with the pages listed in PAGES in main.js.
//
// registerFeature({
//     page: 'program',
//     name: 'terms',
//     description: 'What changes for the user.',
//     renderProgram(program, layout, original) {},   // program page only: called for each program, see program/program-list.js
//     enhancePage(document) {},                      // optional, called once when its page loads
// });
//
// Features run in the order of the manifest.
function registerFeature(feature) {
    FEATURES.push(feature);
}

function buildElement(tagName, className, text = '') {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    return element;
}
