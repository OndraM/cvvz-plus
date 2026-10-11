import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE_2026 = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/program-count.js'];

function countOf(html) {
    const { document } = enhancePage(html, { features: FEATURE });
    return document.querySelector('.program-list-container h3 .cvvz-program-count').textContent;
}

test('shows the number of programs next to the heading, including programs left as the site shows them', () => {
    assert.equal(countOf(PAGE_2026), '110 programů');

    const html = PAGE_2026.replace('<td>Míra náročnosti na interakci</td>', '<td>Nový údaj</td>');
    assert.equal(countOf(html), '110 programů');
});

test('writes the number of programs in correct Czech', () => {
    const { window } = enhancePage(PAGE_2026, { features: FEATURE });

    assert.deepEqual([1, 3, 5].map((count) => window.programCountNoun(count)), ['program', 'programy', 'programů']);
});
