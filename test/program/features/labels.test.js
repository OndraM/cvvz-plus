import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture, textsOf } from '../../helpers.js';

const PAGE_2026 = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/labels.js'];

function labelsOf(html, programId) {
    const { document } = enhancePage(html, { features: FEATURE });
    return document.getElementById(`program-${programId}`).querySelector('.cvvz-labels');
}

test('shows the site labels with their color and the program details, levels as dots', () => {
    const labels = labelsOf(PAGE_2026, '682');
    const badge = labels.querySelector('.cvvz-badge');
    const parameters = labels.querySelectorAll('.cvvz-parameter');

    assert.equal(badge.textContent, 'tvoření');
    assert.equal(badge.style.getPropertyValue('--cvvz-label-color'), 'rgb(185, 208, 17)');
    assert.deepEqual(textsOf(parameters), ['🏋️ Fyzická náročnost Velká', '🤝 Interakce Střední', '📊 Pro začátečníky', '💰 Doplatek: 100']);
    assert.equal(parameters[0].querySelectorAll('.cvvz-dot-on').length, 3);
    assert.equal(parameters[1].querySelectorAll('.cvvz-dot-on').length, 2);
    assert.equal(parameters[0].title, 'Fyzická náročnost: Velká');
    assert.equal(parameters[2].title, 'Úroveň obtížnosti: Základní znalosti');
});

test('highlights an advanced program', () => {
    const html = PAGE_2026.replace('<td>Základní znalosti</td>', '<td>Pokročilé znalosti</td>');
    const difficulty = labelsOf(html, '644').querySelectorAll('.cvvz-parameter')[2];

    assert.equal(difficulty.textContent, '📊 Pro pokročilé');
    assert.ok(difficulty.classList.contains('cvvz-advanced'));
});

test('shows an unknown level or difficulty as it is', () => {
    const html = PAGE_2026.replace('<td>Malá</td>', '<td>Extrémní</td>').replace('<td>Základní znalosti</td>', '<td>Střední znalosti</td>');
    const parameters = labelsOf(html, '644').querySelectorAll('.cvvz-parameter');

    assert.equal(parameters[0].textContent, '🏋️ Fyzická náročnost Extrémní');
    assert.equal(parameters[0].querySelector('.cvvz-dots'), null);
    assert.equal(parameters[2].textContent, '📊 Střední znalosti');
});

test('does not show an empty or zero surcharge', () => {
    const labels = textsOf(labelsOf(PAGE_2026, '644').querySelectorAll('.cvvz-parameter'));
    assert.equal(labels.some((label) => label.includes('Doplatek')), false);

    const html = PAGE_2026.replace('<td>Doplatek na místě</td>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<td></td>', '<td>Doplatek na místě</td><td>0</td>');
    const zeroLabels = textsOf(labelsOf(html, '644').querySelectorAll('.cvvz-parameter'));
    assert.equal(zeroLabels.some((label) => label.includes('Doplatek')), false);
});
