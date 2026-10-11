import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { CONTENT_SCRIPTS, createPage, enhancePage, FEATURE_SCRIPTS, manifest, readFixture, runContentScripts } from './helpers.js';

const PROGRAM_PAGE = readFixture('program-2026-10.html');
const HOMEPAGE = readFixture('homepage-2026-10.html');
const PARTICIPANTS_PAGE = readFixture('participants-2026-10.html');
const SRC_DIR = new URL('../extension/src/', import.meta.url);

const PAGE_DIRS = readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'shared')
    .map((entry) => entry.name);

test('all scripts are in one manifest entry for the whole site', () => {
    // One entry loads every file exactly once into the page's single content script scope,
    // so top-level names cannot clash between entries.
    assert.equal(manifest.content_scripts.length, 1);
    assert.deepEqual(manifest.content_scripts[0].matches, ['https://www.cvvz.cz/*']);
    assert.equal(CONTENT_SCRIPTS[0], 'src/shared/features.js');
    assert.equal(CONTENT_SCRIPTS.at(-1), 'src/main.js');
});

test('every feature script and stylesheet is in the manifest, and every feature has a test', () => {
    const scripts = [];
    const styles = [];
    for (const page of PAGE_DIRS) {
        for (const file of readdirSync(new URL(`${page}/features/`, SRC_DIR))) {
            (file.endsWith('.css') ? styles : scripts).push(`src/${page}/features/${file}`);
        }
    }

    assert.deepEqual([...FEATURE_SCRIPTS].sort(), scripts.sort());
    assert.deepEqual(manifest.content_scripts[0].css.filter((file) => file.includes('/features/')).sort(), styles.sort());
    for (const script of scripts) {
        const testFile = new URL(script.replace('src/', '').replace('.js', '.test.js'), import.meta.url);
        assert.ok(existsSync(testFile), `missing test for ${script}`);
    }
});

test('every feature file registers one feature of its folder\'s page, named after the file, with a label', () => {
    for (const script of FEATURE_SCRIPTS) {
        const dom = createPage('<html><body></body></html>');
        runContentScripts(dom, ['src/shared/features.js', script]);
        // A top-level const of a content script is not a window property, so it is read by evaluating its name.
        const [feature, ...others] = dom.window.eval('FEATURES');

        assert.equal(others.length, 0, `${script} registers more than one feature`);
        assert.equal(feature.page, script.split('/')[1], `${script} is in the folder of another page`);
        assert.equal(feature.name, script.split('/').at(-1).replace('.js', ''));
        assert.ok(feature.label?.length > 10, `${script} needs a label for its switch in the options`);
    }
});

test('main.js knows the page of every page folder', () => {
    const { window } = enhancePage(HOMEPAGE, { url: 'https://www.cvvz.cz/' });

    assert.deepEqual(Object.keys(window.eval('PAGES')).sort(), PAGE_DIRS.sort());
});

test('a page changed by a previous run is left alone, as when the extension is reloaded in an open tab', () => {
    const { document } = enhancePage(PROGRAM_PAGE);
    assert.ok(document.documentElement.hasAttribute('data-cvvz-plus'));

    const { document: changedBefore } = enhancePage(PROGRAM_PAGE, {
        beforeEnhance: (window) => window.document.documentElement.setAttribute('data-cvvz-plus', ''),
    });
    assert.equal(changedBefore.querySelector('.cvvz-logo-plus, .cvvz-program'), null);
});

test('features turned off in the options do not run', () => {
    const { document, warnings } = enhancePage(HOMEPAGE, { url: 'https://www.cvvz.cz/', disabledFeatures: ['site/logo-plus'] });

    assert.equal(document.querySelector('.cvvz-logo-plus'), null);
    assert.deepEqual(warnings, []);
});

test('on other pages, only the site features run', () => {
    const { document, warnings } = enhancePage(HOMEPAGE, { url: 'https://www.cvvz.cz/' });

    assert.ok(document.querySelector('.cvvz-logo-plus'));
    assert.deepEqual(warnings, []);
});

test('program features run only on the program page, also with a filter in the URL', () => {
    const elsewhere = enhancePage(PROGRAM_PAGE, { url: 'https://www.cvvz.cz/' }).document;
    assert.equal(elsewhere.querySelector('.cvvz-program, .cvvz-filter-form'), null);
    assert.ok(elsewhere.querySelector('.cvvz-logo-plus'));

    const filtered = enhancePage(PROGRAM_PAGE, { url: 'https://www.cvvz.cz/program?program_filter%5Btype%5D=workshop' }).document;
    assert.equal(filtered.querySelectorAll('section.cvvz-program').length, 110);
});

test('participant features run only on the participant page, also with a filter in the URL', () => {
    const elsewhere = enhancePage(PARTICIPANTS_PAGE, { url: 'https://www.cvvz.cz/' });
    assert.equal(elsewhere.document.querySelector('.cvvz-compact-table, .cvvz-contacts, .cvvz-stats'), null);
    assert.deepEqual(elsewhere.warnings, []);

    const filtered = enhancePage(PARTICIPANTS_PAGE, { url: 'https://www.cvvz.cz/prihlaseni-ucastnici?event_registration_filter%5Bcity%5D=Brno' });
    assert.ok(filtered.document.querySelector('.cvvz-compact-table .cvvz-contacts'));
    assert.deepEqual(filtered.warnings, []);
});

test('when the settings cannot be read, all features run as by default', () => {
    const { document } = enhancePage(PROGRAM_PAGE, {
        beforeEnhance: (window) => {
            window.chrome.storage.sync.get = (defaults, callback) => callback(undefined);
        },
    });

    assert.ok(document.querySelector('.cvvz-logo-plus'));
    assert.equal(document.querySelectorAll('section.cvvz-program').length, 110);
});

test('a failing feature is reported in the console and the following features still run', () => {
    const { document, warnings } = enhancePage(HOMEPAGE, {
        url: 'https://www.cvvz.cz/',
        beforeEnhance: (window) => window.eval('FEATURES').unshift({
            page: 'site',
            name: 'broken',
            enhancePage() {
                throw new Error('boom');
            },
        }),
    });

    assert.ok(document.querySelector('.cvvz-logo-plus'));
    assert.equal(warnings[0][0], 'CVVZ plus: některé části stránky zůstaly v původní podobě');
    assert.deepEqual(structuredClone(warnings[0][1]), [{ id: 'site/broken', reason: 'boom' }]);
});
