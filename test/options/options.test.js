import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPage, EXTENSION_DIR, FEATURE_SCRIPTS, runContentScripts, stubExtensionStorage, textsOf } from '../helpers.js';

const OPTIONS_URL = new URL('options/options.html', EXTENSION_DIR);
const OPTIONS_HTML = readFileSync(OPTIONS_URL, 'utf8');

function scriptsOf(document) {
    return [...document.querySelectorAll('script')]
        .map((script) => new URL(script.getAttribute('src'), OPTIONS_URL).href.replace(EXTENSION_DIR.href, ''));
}

function openOptions(settings) {
    const dom = createPage(OPTIONS_HTML);
    const storedSettings = stubExtensionStorage(dom.window, settings);
    runContentScripts(dom, scriptsOf(dom.window.document));
    return { document: dom.window.document, storedSettings };
}

function uncheckedFeatures(document) {
    return [...document.querySelectorAll('input:not(:checked)')].map((checkbox) => checkbox.value);
}

test('loads the shared code and all feature scripts of the manifest, in the order of their switches', () => {
    const scripts = scriptsOf(createPage(OPTIONS_HTML).window.document);

    assert.equal(scripts[0], 'src/shared/features.js');
    assert.equal(scripts.at(-1), 'options/options.js');
    assert.deepEqual(scripts.slice(1, -1).sort(), [...FEATURE_SCRIPTS].sort());
});

test('shows a switch for every feature, grouped by page, all on by default', () => {
    const { document } = openOptions();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    assert.deepEqual(textsOf(document.querySelectorAll('legend')), ['Celý web', 'Stránka Program', 'Stránka Přihlášení účastníci', 'Stránka Moje programy']);
    assert.equal(checkboxes.length, FEATURE_SCRIPTS.length);
    assert.deepEqual(uncheckedFeatures(document), []);
    assert.equal(checkboxes[0].value, 'site/logo-plus');
    assert.equal(checkboxes[0].parentElement.textContent, ' Přidat ikonku ➕ k logu v záhlaví webu (jako znamení, že je rozšíření zapnuto)');
});

test('shows the turned-off features unchecked', () => {
    const { document } = openOptions({ disabledFeatures: ['program/terms'] });

    assert.deepEqual(uncheckedFeatures(document), ['program/terms']);
});

test('saves the turned-off features when a switch changes', () => {
    const { document, storedSettings } = openOptions({ disabledFeatures: ['program/terms'] });

    document.querySelector('input[value="program/description"]').click();

    assert.deepEqual([...storedSettings.disabledFeatures].sort(), ['program/description', 'program/terms']);
});
