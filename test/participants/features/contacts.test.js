import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildParticipantModal, enhancePage, openModal, readFixture, textsOf } from '../../helpers.js';

const PAGE = readFixture('participants-2026-10.html');
const URL = 'https://www.cvvz.cz/prihlaseni-ucastnici';
const FEATURE = ['src/participants/features/contacts.js'];

function contactLinks(document, id) {
    const row = [...document.querySelectorAll('tbody tr')].find((row) => row.cells[0].textContent === id);
    return [...row.querySelectorAll('[data-cvvz-column="facebook"] a.cvvz-contact')].map((link) => [link.title, link.href]);
}

test('shows Facebook, phone and e-mail as links in one column', () => {
    const { document, warnings } = enhancePage(PAGE, { url: URL, features: FEATURE });
    const headings = [...document.querySelectorAll('thead th')].filter((heading) => !heading.classList.contains('cvvz-hidden'));

    assert.deepEqual(warnings, []);
    assert.deepEqual(textsOf(headings).slice(6), ['Město', 'Kontakt', 'Zaplaceno']);
    assert.deepEqual(contactLinks(document, '101'), [
        ['Facebook: jan.testovaci.56', 'https://www.facebook.com/jan.testovaci.56'],
        ['Telefon: 777000101', 'tel:777000101'],
        ['E-mail: jan.testovaci@example.com', 'mailto:jan.testovaci@example.com'],
    ]);
    for (const row of document.querySelectorAll('tbody tr')) {
        assert.ok(row.cells[8].classList.contains('cvvz-hidden'));
        assert.ok(row.cells[9].classList.contains('cvvz-hidden'));
    }
});

test('hides the site\'s own Facebook icon and value', () => {
    const { document } = enhancePage(PAGE, { url: URL, features: FEATURE });
    const facebook = document.querySelector('tbody tr').cells[7];

    assert.deepEqual([...facebook.children].map((element) => element.classList.contains('cvvz-hidden')), [true, true, false]);
});

test('links any Facebook value to Facebook, and searches for what is not a profile', () => {
    const { document } = enhancePage(PAGE, { url: URL, features: FEATURE });
    const facebookUrls = Object.fromEntries(['103', '104', '105', '106', '107', '108'].map((id) => [id, contactLinks(document, id)[0][1]]));

    assert.deepEqual(facebookUrls, {
        103: 'https://m.facebook.com/profile.php?id=100000000000103',
        104: 'https://www.facebook.com/search/top?q=Marie%20P%C5%99%C3%ADkladn%C3%A1',
        105: 'https://www.facebook.com/profile.php?id=100000000000105',
        106: 'https://fb.com/lucie.zkusebni',
        107: 'https://www.facebook.com/share/AbCdEf0107/',
        108: 'https://www.facebook.com/search/top?q=Instagram%3A%20%40jana.smyslena',
    });
});

test('calls the phone number without spaces', () => {
    const { document } = enhancePage(PAGE, { url: URL, features: FEATURE });

    assert.deepEqual(contactLinks(document, '104')[1], ['Telefon: +420 777 000 104', 'tel:+420777000104']);
});

test('shows no links for a participant without contacts, also when Facebook is filled in empty', () => {
    const { document } = enhancePage(PAGE, { url: URL, features: FEATURE });

    assert.deepEqual(contactLinks(document, '102'), []);
    assert.deepEqual(contactLinks(document, '109'), []);
});

test('works together with the compact table, in any order', () => {
    const features = ['src/participants/features/contacts.js', 'src/participants/features/compact-table.js'];
    for (const order of [features, features.toReversed()]) {
        const { document, warnings } = enhancePage(PAGE, { url: URL, features: order });

        assert.deepEqual(warnings, []);
        assert.equal(contactLinks(document, '101').length, 3);
        assert.ok(document.querySelector('.cvvz-compact-table .cvvz-nickname'));
    }
});

test('shows the contacts also in both tables of the modal with the participants of a program term', async () => {
    const { window, warnings } = enhancePage(readFixture('program-2026-10.html'), { features: FEATURE });
    const modal = await openModal(window, buildParticipantModal(PAGE));

    assert.deepEqual(warnings, []);
    for (const table of modal.querySelectorAll('table')) {
        assert.equal(table.querySelector('thead th:nth-child(8)').textContent, 'Kontakt');
        assert.equal(table.querySelectorAll('tbody tr:first-child a.cvvz-contact').length, 3);
    }
});
