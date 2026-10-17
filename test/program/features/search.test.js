import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/search.js'];

function type(window, text) {
    const input = window.document.getElementById('cvvz-search');
    input.value = text;
    input.dispatchEvent(new window.Event('input'));
}

function visibleProgramIds(document) {
    return [...document.querySelectorAll('.program-list-container [data-program-id]:not(.cvvz-search-hidden)')]
        .map((program) => program.dataset.programId);
}

test('adds its own search field outside the filter form of the site, above the heading of the list of programs', () => {
    const { document } = enhancePage(PAGE, { features: FEATURE });
    const search = document.querySelector('.cvvz-search');

    assert.equal(search.querySelector('label').textContent, 'Hledat v názvech a v textu');
    assert.ok(search.querySelector('label .cvvz-plus-badge'));
    assert.equal(document.getElementById('program_filter_form').contains(search), false);
    assert.equal(search.nextElementSibling, document.querySelector('.program-list-container h3'));
});

test('shows only the programs with all typed words in the title, perex, description, lecturer or label, ignoring case and accents', () => {
    const { window, document } = enhancePage(PAGE, { features: FEATURE });
    const heading = document.querySelector('.program-list-container h3');

    for (const text of ['SOUHVEZDI boj', 'bojovka', 'jelinkova']) {
        type(window, text);
        assert.deepEqual(visibleProgramIds(document), ['676'], text);
    }
    assert.ok(heading.classList.contains('cvvz-searching'));
    assert.equal(heading.querySelector('.cvvz-search-count').textContent, 'Zobrazeno 1 z 137 programů');

    type(window, 'právo bezpečnost');
    assert.deepEqual(visibleProgramIds(document), ['662']);
});

test('shows all programs again when the field is emptied, also by its clear button', () => {
    const { window, document } = enhancePage(PAGE, { features: FEATURE });
    const clear = document.querySelector('.cvvz-search-clear');
    const heading = document.querySelector('.program-list-container h3');
    assert.equal(clear.hidden, true);

    type(window, 'bojovka');
    assert.equal(clear.hidden, false);
    clear.click();

    assert.equal(document.getElementById('cvvz-search').value, '');
    assert.equal(visibleProgramIds(document).length, 137);
    assert.equal(heading.classList.contains('cvvz-searching'), false);
    assert.equal(clear.hidden, true);

    type(window, ' ');
    assert.equal(visibleProgramIds(document).length, 137);
    assert.equal(heading.classList.contains('cvvz-searching'), false);
});
