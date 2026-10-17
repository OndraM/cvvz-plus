import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE = readFixture('moje-programy-2026-10.html');
const URL = 'https://www.cvvz.cz/moje-programy';
const FEATURE = ['src/my-programs/features/all-programs-link.js'];

test('adds a link to all programs right after the page heading, before the export button', () => {
    const { document, warnings } = enhancePage(PAGE, { url: URL, features: ['src/my-programs/features/pdf-export.js', ...FEATURE] });
    const row = document.querySelector('.cvvz-pdf-export-row');
    const link = row.querySelector('a.cvvz-all-programs');

    assert.deepEqual(warnings, []);
    assert.deepEqual([...row.children], [row.querySelector('h2'), link, row.querySelector('a.cvvz-pdf-export')]);
    assert.equal(link.textContent, 'Všechny programy');
    assert.equal(link.getAttribute('href'), '/program');
});

test('adds the link below the heading when the export button stays where the site shows it', () => {
    const { document, warnings } = enhancePage(PAGE, { url: URL, features: FEATURE });

    assert.deepEqual(warnings, []);
    assert.equal(document.querySelector('h2.color-primary').nextElementSibling, document.querySelector('a.cvvz-all-programs'));
});

test('adds nothing when the page heading is not there', () => {
    const page = PAGE.replace('<h2 class="color-primary">Moje programy</h2>', '<h2 class="color-primary">Moje přihlášky</h2>');
    const { document, warnings } = enhancePage(page, { url: URL, features: FEATURE });

    assert.equal(document.querySelector('.cvvz-all-programs'), null);
    assert.deepEqual(structuredClone(warnings[0][1]), [{ id: 'my-programs/all-programs-link', reason: 'page heading not found' }]);
});
