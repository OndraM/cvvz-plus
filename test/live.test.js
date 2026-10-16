// Checks the extension against the current live page (needs network): npm run test:live
// When it fails, the site HTML changed: save the page as a new fixture (see README) and adjust the parser or the features.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, enhancePage, findIncompletePrograms, openModal } from './helpers.js';

const PROGRAM_URL = 'https://www.cvvz.cz/program';

test('the extension understands every program on the live page and shows all its information', async () => {
    const response = await fetch(PROGRAM_URL);
    assert.equal(response.status, 200);

    const { document, entries, warnings } = enhancePage(await response.text(), { url: PROGRAM_URL });

    assert.deepEqual(warnings.map(([, failures]) => structuredClone(failures)), [], 'some programs or features failed');
    assert.ok(entries.length > 0, 'no programs found');
    assert.deepEqual(findIncompletePrograms(document, entries), []);
    console.log(`Checked ${entries.length} programs on ${PROGRAM_URL}`);
});

const PARTICIPANTS_URL = 'https://www.cvvz.cz/prihlaseni-ucastnici';

test('the extension understands the live participant list', async () => {
    const response = await fetch(PARTICIPANTS_URL);
    assert.equal(response.status, 200);

    const { document, warnings } = enhancePage(await response.text(), { url: PARTICIPANTS_URL });

    assert.deepEqual(warnings.map(([, failures]) => structuredClone(failures)), [], 'some features failed');
    const rows = document.querySelectorAll('.cvvz-compact-table tbody tr');
    assert.ok(rows.length > 0, 'no participants found');
    console.log(`Checked ${rows.length} participants on ${PARTICIPANTS_URL}`);
});

test('the extension understands the live modal with the participants of a program term', async () => {
    const page = await (await fetch(PROGRAM_URL)).text();
    const terms = [...createPage(page).window.document.querySelectorAll('.ajax-modal')].map((count) => {
        const [registered, , watching] = count.textContent.trim().split('/').map(Number);
        return { url: new URL(count.dataset.url, PROGRAM_URL).href, registered, watching };
    });
    // Terms with watchers first, as only their modal has both tables.
    const term = terms.sort((a, b) => b.watching - a.watching || b.registered - a.registered)[0];
    assert.ok(term?.registered > 0, 'no term with participants found');
    const response = await fetch(term.url);
    assert.equal(response.status, 200);

    const { window, warnings } = enhancePage(page, { url: PROGRAM_URL });
    const modal = await openModal(window, await response.text());

    assert.deepEqual(warnings.map(([, failures]) => structuredClone(failures)), [], 'some programs or features failed');
    const tables = modal.querySelectorAll('.table-container');
    assert.ok(tables.length > 0, 'no participant table in the modal');
    assert.equal(modal.querySelectorAll('.cvvz-compact-table').length, tables.length);
    const rows = modal.querySelectorAll('tbody tr');
    assert.equal(modal.querySelectorAll('tbody .cvvz-contacts').length, rows.length);
    assert.equal(modal.querySelectorAll('[data-cvvz-column="paid"]:not(.cvvz-hidden)').length, 0);
    console.log(`Checked ${rows.length} participants in ${tables.length} tables of the modal ${term.url}`);
});
