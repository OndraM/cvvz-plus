import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture, textsOf } from '../../helpers.js';

const PAGE = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/term-conflicts.js'];

function termOf(document, termId) {
    return document.querySelector(`li[data-program-time-block-id="${termId}"]`);
}

function replaceTermForm(document, termId, action, buttonText) {
    termOf(document, termId).querySelector('form').outerHTML = `
        <form action="${action}" method="post" class="ms-auto js-program-action" data-program-time-block-id="${termId}">
            <input type="hidden" name="id" value="1">
            <button type="submit" class="btn btn-link btn-sm p-0 color-primary color-primary-on-hover underline fw-bold">${buttonText}</button>
        </form>`;
}

test('notes the program the user is registered to or watches at the other terms of the same time', () => {
    const { document } = enhancePage(PAGE, { features: FEATURE });

    assert.deepEqual(textsOf(termOf(document, '935').querySelectorAll('.cvvz-term-conflict')), ['V tu dobu máš: Jsem hlavas - pro hlavní vedoucí kolektivů s celoroční činností']);
    assert.equal(termOf(document, '935').querySelector('.cvvz-term-conflict a').getAttribute('href'), '#program-638');
    assert.ok(termOf(document, '935').classList.contains('cvvz-term-taken'));
    assert.equal(termOf(document, '938').querySelector('.cvvz-term-conflict'), null);
    assert.equal(document.querySelectorAll('.cvvz-term-taken').length, 34);

    assert.deepEqual(textsOf(termOf(document, '888').querySelectorAll('.cvvz-term-conflict')), ['V tu dobu hlídáš: To je cirkus! aneb drobná ochutnávka cirkusové pedagogiky']);
    assert.equal(termOf(document, '888').classList.contains('cvvz-term-taken'), false);
    assert.equal(document.querySelectorAll('.cvvz-term-conflict').length, 34 + 13);
});

test('follows the buttons the site replaces after signing up or out, without reloading the page', async () => {
    const { document } = enhancePage(PAGE, { features: FEATURE });

    replaceTermForm(document, '938', '/register-program-timeblock', 'Přihlásit se');
    await new Promise((resolve) => setTimeout(resolve));

    assert.equal(termOf(document, '935').querySelector('.cvvz-term-conflict'), null);
    assert.equal(termOf(document, '935').classList.contains('cvvz-term-taken'), false);

    replaceTermForm(document, '935', '/unregister-program-timeblock', 'Odhlásit se');
    await new Promise((resolve) => setTimeout(resolve));

    assert.equal(termOf(document, '938').querySelector('.cvvz-term-conflict a').getAttribute('href'), '#program-676');
    assert.equal(termOf(document, '935').querySelector('.cvvz-term-conflict'), null);
    assert.equal(document.querySelectorAll('.cvvz-term-taken').length, 34);
});

test('compares the times also when the term-capacity feature shortened them', () => {
    const { document } = enhancePage(PAGE, { features: ['src/program/features/term-capacity.js', ...FEATURE] });

    assert.equal(document.querySelectorAll('.cvvz-term-taken').length, 34);
});

const MY_PROGRAMS = readFixture('moje-programy-2026-10.html').replace(
    '<a href="/program#program-103">Ukázkový program s opravdu hodně dlouhým názvem, který se nevejde na jeden řádek</a>',
    '<a href="/program#program-638">Jsem hlavas - pro hlavní vedoucí kolektivů s celoroční činností</a>',
);

function openFilteredPage(url, { removeProgram } = {}) {
    const fetched = [];
    const page = enhancePage(PAGE, {
        url,
        features: FEATURE,
        beforeEnhance: (window) => {
            window.fetch = async (resource) => {
                fetched.push(resource);
                return { text: async () => MY_PROGRAMS };
            };
            window.document.querySelector(`[data-program-id="${removeProgram}"]`)?.remove();
        },
    });
    return { ...page, fetched };
}

test('on a filtered list without the user\'s program, notes it from the page My programs', async () => {
    const { document, fetched, warnings } = openFilteredPage('https://www.cvvz.cz/program?program_filter%5Btype%5D=workshop', { removeProgram: '638' });
    assert.equal(termOf(document, '935').querySelector('.cvvz-term-conflict'), null);

    await new Promise((resolve) => setTimeout(resolve));
    assert.deepEqual(fetched, ['/moje-programy']);
    assert.deepEqual(warnings, []);
    assert.deepEqual(textsOf(termOf(document, '935').querySelectorAll('.cvvz-term-conflict')), ['V tu dobu máš: Jsem hlavas - pro hlavní vedoucí kolektivů s celoroční činností']);
    assert.equal(termOf(document, '935').querySelector('.cvvz-term-conflict a').getAttribute('href'), '/program#program-638');
    assert.ok(termOf(document, '935').classList.contains('cvvz-term-taken'));
});

test('a program of the user on the filtered list is noted as the page shows it, only once', async () => {
    const { document } = openFilteredPage('https://www.cvvz.cz/program?program_filter%5Btype%5D=workshop');
    await new Promise((resolve) => setTimeout(resolve));

    assert.deepEqual(textsOf(termOf(document, '935').querySelectorAll('.cvvz-term-conflict')), ['V tu dobu máš: Jsem hlavas - pro hlavní vedoucí kolektivů s celoroční činností']);
    assert.equal(termOf(document, '935').querySelector('.cvvz-term-conflict a').getAttribute('href'), '#program-638');
});

test('the whole list reads nothing more', async () => {
    const { fetched } = openFilteredPage('https://www.cvvz.cz/program');
    await new Promise((resolve) => setTimeout(resolve));

    assert.deepEqual(fetched, []);
});
