import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildParticipantModal, enhancePage, openModal, readFixture, textsOf } from '../../helpers.js';

const PAGE = readFixture('participants-2026-10.html');
const URL = 'https://www.cvvz.cz/prihlaseni-ucastnici';
const FEATURE = ['src/participants/features/compact-table.js'];
const PROGRAM_PAGE = readFixture('program-2026-10.html');

function participantRow(document, id) {
    return [...document.querySelectorAll('tbody tr')].find((row) => row.cells[0].textContent === id);
}

function visibleTexts(cells) {
    return textsOf([...cells].filter((cell) => !cell.classList.contains('cvvz-hidden')));
}

test('makes the rows of the table lower', () => {
    const { document, warnings } = enhancePage(PAGE, { url: URL, features: FEATURE });

    assert.ok(document.querySelector('.table-container').classList.contains('cvvz-compact-table'));
    assert.deepEqual(warnings, []);
});

test('shows the first name, last name and nickname in one column, followed by paid', () => {
    const { document } = enhancePage(PAGE, { url: URL, features: FEATURE });

    assert.deepEqual(visibleTexts(document.querySelectorAll('thead th')), [
        'ID', 'Jméno', 'Zaplaceno', 'Stupeň BL', 'Organizace', 'Město', 'FB', 'Tel', 'E-mail',
    ]);
    assert.deepEqual(textsOf(participantRow(document, '101').cells[1].children), ['Jan Testovací', 'Tester']);
    assert.deepEqual(textsOf(participantRow(document, '102').cells[1].children), ['Eva Ukázková']);
    assert.deepEqual(textsOf(participantRow(document, '109').cells[1].children), ['Bezejmenná']);
    for (const row of document.querySelectorAll('tbody tr')) {
        assert.equal(visibleTexts(row.cells).length, 9);
        assert.equal(row.cells[2].dataset.cvvzColumn, 'paid');
    }
});

test('shows paid as ✓ and not paid as ✗', () => {
    const { document } = enhancePage(PAGE, { url: URL, features: FEATURE });
    const paid = participantRow(document, '101').cells[2];
    const unpaid = participantRow(document, '103').cells[2];

    assert.deepEqual([paid.textContent, paid.title], ['✓', 'Zaplaceno']);
    assert.deepEqual([unpaid.textContent, unpaid.title], ['✗', 'Nezaplaceno']);
});

test('lets a long Facebook value wrap', () => {
    const { document } = enhancePage(PAGE, { url: URL, features: FEATURE });
    const facebook = participantRow(document, '103').querySelector('[data-cvvz-column="facebook"]');

    assert.equal(facebook.classList.contains('text-nowrap'), false);
    assert.ok(facebook.classList.contains('cvvz-facebook'));
});

test('works with a filter that found no participants', () => {
    const { warnings } = enhancePage(PAGE.replace(/<tbody>[\s\S]*<\/tbody>/, '<tbody></tbody>'), { url: URL, features: FEATURE });

    assert.deepEqual(warnings, []);
});

test('leaves the table as the site shows it when the site changed its columns', () => {
    const { document, warnings } = enhancePage(PAGE.replace('<th>Přezdívka</th>', '<th>Nick</th>'), { url: URL, features: FEATURE });

    assert.equal(document.querySelector('.cvvz-compact-table, .cvvz-hidden'), null);
    assert.match(warnings[0][1][0].reason, /^unexpected columns: ID, Jméno, Příjmení, Nick,/);
});

test('makes both tables of the modal with the participants of a program term compact too, without paid', async () => {
    const { window, warnings } = enhancePage(PROGRAM_PAGE, { features: FEATURE });
    const modal = await openModal(window, buildParticipantModal(PAGE));
    const tables = modal.querySelectorAll('.table-container');

    assert.deepEqual(warnings, []);
    assert.equal(tables.length, 2);
    for (const table of tables) {
        assert.ok(table.classList.contains('cvvz-compact-table'));
        assert.deepEqual(visibleTexts(table.querySelectorAll('thead th')), [
            'ID', 'Jméno', 'Stupeň BL', 'Organizace', 'Město', 'FB', 'Tel', 'E-mail',
        ]);
        for (const row of table.querySelectorAll('tbody tr')) {
            assert.equal(visibleTexts(row.cells).length, 8);
        }
        assert.deepEqual(textsOf(table.querySelector('tbody tr').cells[1].children), ['Jan Testovací', 'Tester']);
    }
    assert.equal(window.document.querySelector('.cvvz-participants:not(.modal *)'), null, 'tables of the program page are left alone');
});

test('leaves the modal without participants as it is', async () => {
    const { window, warnings } = enhancePage(PROGRAM_PAGE, { features: FEATURE });
    await openModal(window, '<div class="modal fade"><div class="container"><p>Nikdo není přihlášený</p></div></div>');

    assert.deepEqual(warnings, []);
});

test('leaves the modal as the site shows it when the site changed its columns', async () => {
    const { window, warnings } = enhancePage(PROGRAM_PAGE, { features: FEATURE });
    const modal = await openModal(window, buildParticipantModal(PAGE.replace('<th>Přezdívka</th>', '<th>Nick</th>')));

    assert.equal(modal.querySelector('.cvvz-compact-table, .cvvz-hidden'), null);
    assert.equal(warnings[0][1][0].id, 'participants/compact-table');
    assert.match(warnings[0][1][0].reason, /^unexpected columns: ID, Jméno, Příjmení, Nick,/);
});
