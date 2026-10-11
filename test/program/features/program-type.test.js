import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE_2026 = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/program-type.js'];

function typeTagOf(html, programId) {
    const { document } = enhancePage(html, { features: FEATURE });
    return document.getElementById(`program-${programId}`).querySelector('.cvvz-header .cvvz-type')?.textContent;
}

test('shows the program type with an emoji in the header', () => {
    assert.equal(typeTagOf(PAGE_2026, '644'), '🧑‍🏫 Přednáška');
    assert.equal(typeTagOf(PAGE_2026, '682'), '🖐️ Rukodělka');
});

test('does not show the type "Jiné"', () => {
    const html = PAGE_2026.replace('<td>Přednáška</td>', '<td>Jiné</td>');

    assert.equal(typeTagOf(html, '644'), undefined);
});

test('shows an unknown type as it is', () => {
    const html = PAGE_2026.replace('<td>Přednáška</td>', '<td>Hra</td>');

    assert.equal(typeTagOf(html, '644'), 'Hra');
});
