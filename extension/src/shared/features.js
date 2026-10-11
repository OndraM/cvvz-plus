const FEATURES = [];

// A feature is one self-contained adjustment of the site, in the folder of the page it changes:
// src/<page>/features/<name>.js, with the pages listed in PAGES in main.js.
//
// registerFeature({
//     page: 'program',
//     name: 'description',
//     label: 'Popis přepínače v nastavení rozšíření (česky)',
//     shows: ['description'],                        // program page only: program fields it shows; the site's
//                                                    // original rows of these fields get hidden, see program/program-list.js
//     renderProgram(program, layout, original) {},   // program page only: called for each program
//     enhancePage(document) {},                      // optional, called once when its page loads
//     enhanceSite(document) {},                      // optional, called once on every page of the site,
//                                                    // for the parts of a feature outside its page (like a link to it)
// });
//
// Features run in the order of the manifest.
function registerFeature(feature) {
    FEATURES.push(feature);
}

function featureId(feature) {
    return `${feature.page}/${feature.name}`;
}

// Settings use callbacks, which the chrome namespace supports in both Firefox and Chrome.
// Only turned-off features are stored, so all features (including new ones) are on by default.
function loadDisabledFeatureIds(callback) {
    chrome.storage.sync.get({ disabledFeatures: [] }, (settings) => callback(settings?.disabledFeatures ?? []));
}

function saveDisabledFeatureIds(ids) {
    chrome.storage.sync.set({ disabledFeatures: ids });
}

function buildElement(tagName, className, text = '') {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    return element;
}
