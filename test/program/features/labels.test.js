import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture, textsOf } from '../../helpers.js';

const PAGE_2026 = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/labels.js'];

function labelsOf(html, programId) {
    const { document } = enhancePage(html, { features: FEATURE });
    return document.getElementById(`program-${programId}`).querySelector('.cvvz-labels');
}

test('shows the site labels with their colors and the program details as labels', () => {
    const labels = labelsOf(PAGE_2026, '682');
    const badge = labels.querySelector('.cvvz-badge');

    assert.equal(badge.textContent, 'tvoření');
    assert.equal(badge.style.backgroundColor, 'rgb(185, 208, 17)');
    assert.deepEqual(textsOf(labels.querySelectorAll('.cvvz-label')), [
        '🏋️ Fyzická náročnost: Velká',
        '🤝 Interakce: Střední',
        '📊 Obtížnost: Základní',
        '💰 Doplatek: 100',
    ]);
});

test('does not show an empty or zero surcharge', () => {
    const labels = textsOf(labelsOf(PAGE_2026, '644').querySelectorAll('.cvvz-label'));
    assert.equal(labels.some((label) => label.includes('Doplatek')), false);

    const html = PAGE_2026.replace('<td>Doplatek na místě</td>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<td></td>', '<td>Doplatek na místě</td><td>0</td>');
    const zeroLabels = textsOf(labelsOf(html, '644').querySelectorAll('.cvvz-label'));
    assert.equal(zeroLabels.some((label) => label.includes('Doplatek')), false);
});
