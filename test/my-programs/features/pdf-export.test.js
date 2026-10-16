import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE = readFixture('moje-programy-2026-10.html');
const URL = 'https://www.cvvz.cz/moje-programy';
const FEATURE = ['src/my-programs/features/pdf-export.js'];

test('moves the export link next to the page heading, as a button', () => {
    const { document, warnings } = enhancePage(PAGE, { url: URL, features: FEATURE });
    const row = document.querySelector('.cvvz-pdf-export-row');
    const link = row.querySelector('a.cvvz-pdf-export');

    assert.deepEqual(warnings, []);
    assert.deepEqual([...row.children].map((child) => child.tagName), ['H2', 'A']);
    assert.equal(row.querySelector('h2').textContent, 'Moje programy');
    assert.equal(link.textContent, 'Export do PDF');
    assert.equal(link.querySelector('.cvvz-pdf-export-words').textContent, 'Export do ');
    assert.equal(link.getAttribute('href'), '/moje-programy/pdf');
    assert.equal(link.target, '_blank');
    assert.ok(document.querySelector('.text-end').classList.contains('cvvz-hidden'));
});

test('leaves the link as the site shows it when there is more next to it', () => {
    const page = PAGE.replace('Export do PDF</a>', 'Export do PDF</a> nebo <a href="/moje-programy/ics">Kalendář</a>');
    const { document, warnings } = enhancePage(page, { url: URL, features: FEATURE });

    assert.equal(document.querySelector('.cvvz-pdf-export-row, .cvvz-hidden'), null);
    assert.deepEqual(structuredClone(warnings[0][1]), [{ id: 'my-programs/pdf-export', reason: 'unexpected export link or page heading' }]);
});

test('works together with the timeline', () => {
    const { document, warnings } = enhancePage(PAGE, {
        url: URL,
        features: ['src/my-programs/features/timeline.js', ...FEATURE],
        // During the event, the timer of the timeline's current time would keep the tests running.
        beforeEnhance: (window) => {
            window.setInterval = () => {};
        },
    });

    assert.deepEqual(warnings, []);
    assert.ok(document.querySelector('.cvvz-pdf-export-row a.cvvz-pdf-export'));
    assert.ok(document.querySelector('.cvvz-tabs + .cvvz-timeline + .table-container'));
});
