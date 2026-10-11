import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { JSDOM } from 'jsdom';

export const EXTENSION_DIR = new URL('../extension/', import.meta.url);

export const manifest = JSON.parse(readFileSync(new URL('manifest.json', EXTENSION_DIR), 'utf8'));

export const CONTENT_SCRIPTS = manifest.content_scripts[0].js;
export const FEATURE_SCRIPTS = CONTENT_SCRIPTS.filter((file) => file.includes('/features/'));
// Shared and page code the features build on, without main.js which changes the page.
const BASE_SCRIPTS = CONTENT_SCRIPTS.filter((file) => !FEATURE_SCRIPTS.includes(file) && file !== 'src/main.js');

export function readFixture(name) {
    return readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');
}

export function createPage(html, url = 'https://www.cvvz.cz/program') {
    return new JSDOM(html, { url, runScripts: 'outside-only' });
}

// Runs content scripts the way a browser does: as separate classic scripts sharing one global scope.
export function runContentScripts(dom, files) {
    for (const file of files) {
        const code = readFileSync(new URL(file, EXTENSION_DIR), 'utf8');
        new Script(code, { filename: file }).runInContext(dom.getInternalVMContext());
    }
}

// Stand-in for the browser's extension storage with the given settings. It calls back synchronously,
// so tests can check the page right after the scripts ran. Returns the settings object, updated on save.
export function stubExtensionStorage(window, settings = {}) {
    window.chrome = {
        storage: {
            sync: {
                get: (defaults, callback) => callback({ ...defaults, ...settings }),
                set: (values) => Object.assign(settings, values),
            },
        },
    };
    return settings;
}

// Runs the extension on the page with the given features (all of them by default), in manifest order.
// `disabledFeatures` are ids of the features turned off in the options.
// Returns the parsed entries, so tests can reach the original elements of each program.
// `beforeEnhance(window, entries)` runs after the features are registered, right before main.js changes the page.
export function enhancePage(html, { url, features = FEATURE_SCRIPTS, disabledFeatures = [], beforeEnhance } = {}) {
    const dom = createPage(html, url);
    const { window } = dom;
    const warnings = [];
    window.console.warn = (...args) => warnings.push(args);
    stubExtensionStorage(window, { disabledFeatures });

    runContentScripts(dom, [...BASE_SCRIPTS, ...features]);
    const { entries } = window.parseProgramList(window.document);
    beforeEnhance?.(window, entries);
    runContentScripts(dom, ['src/main.js']);

    return { window, document: window.document, entries, warnings };
}

export function textsOf(elements) {
    return [...elements].map((element) => element.textContent.trim());
}

// Words the extension deliberately replaces or hides: table headings, links it re-labels,
// "Jiné" type, "znalosti" in the difficulty, and a zero surcharge.
const REPLACED_WORDS = new Set(wordsOf(`
    Lektor Detailní popis Další podrobnosti Zobrazit programy tohoto lektora
    Provedení Míra fyzického zapojení účastníků Míra náročnosti na interakci Úroveň obtížnosti programu
    Doplatek na místě znalosti Rukodělná aktivita Pohybová aktivita Jiné 0
`));

// Programs whose new section does not show all words of their original elements, as [{ id, missing: [words] }].
// Original parts left visible (of turned-off features) are inside the section too. Expands shortened descriptions first.
export function findIncompletePrograms(document, entries) {
    for (const link of document.querySelectorAll('.cvvz-more[aria-expanded="false"]')) {
        link.click();
    }
    return [...entries]
        .map(({ program, original }) => ({
            id: program.id,
            missing: findMissingWords(
                document.getElementById(`program-${program.id}`),
                [original.header, original.perex, original.labels, original.tableContainer].filter(Boolean),
            ),
        }))
        .filter(({ missing }) => missing.length > 0);
}

function findMissingWords(section, originalElements) {
    const sectionWords = new Set(wordsOf(textWithSpaces(section, { visibleOnly: true })));
    const originalWords = new Set(originalElements.flatMap((element) => wordsOf(textWithSpaces(element))));
    return [...originalWords].filter((word) => !sectionWords.has(word) && !REPLACED_WORDS.has(word));
}

// Like textContent, but separates text of neighbouring elements, which are rendered apart,
// and can leave out elements hidden by the extension.
function textWithSpaces(node, { visibleOnly = false } = {}) {
    if (node.nodeType === node.TEXT_NODE) {
        return node.textContent;
    }
    if (visibleOnly && node.classList?.contains('cvvz-hidden')) {
        return '';
    }
    return [...node.childNodes].map((child) => textWithSpaces(child, { visibleOnly })).join(' ');
}

function wordsOf(text) {
    return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}
