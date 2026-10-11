import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, FEATURE_SCRIPTS, findIncompletePrograms, readFixture } from '../helpers.js';

const PAGE_2026 = readFixture('program-2026-10.html');
const PAGE_2025 = readFixture('program-2025-11.html');

const PROGRAM_FEATURE_IDS = FEATURE_SCRIPTS
    .filter((file) => file.startsWith('src/program/'))
    .map((file) => `program/${file.split('/').at(-1).replace('.js', '')}`);

function isHidden(element) {
    return element.classList.contains('cvvz-hidden');
}

function hiddenOriginals(original) {
    return [original.header, original.perex, original.labels, original.tableContainer];
}

test('replaces every program with a section and only hides the original elements', () => {
    const { document, entries, warnings } = enhancePage(PAGE_2026);

    assert.equal(document.querySelectorAll('section.cvvz-program').length, 110);
    assert.deepEqual(warnings, []);
    for (const { original } of entries) {
        for (const element of hiddenOriginals(original)) {
            assert.ok(element.isConnected);
            assert.ok(element.classList.contains('cvvz-hidden'));
        }
    }
});

test('the section has the title and perex and takes over the program id', () => {
    const { document, entries } = enhancePage(PAGE_2026, { features: [] });
    const section = document.getElementById('program-644');

    assert.ok(section.matches('section.cvvz-program'));
    assert.equal(section.querySelector('.cvvz-header > h4').textContent, '„Nabité“ rekvizity aneb nebojte se elektroniky');
    assert.ok(section.querySelector('.cvvz-perex').textContent.startsWith('Je libo tajemné vejce'));
    assert.equal(entries[0].original.header.hasAttribute('id'), false);
});

test('leaves a program that fails to parse untouched', () => {
    const html = PAGE_2026.replace('<td>Míra náročnosti na interakci</td>', '<td>Nový údaj</td>');
    const { document, warnings } = enhancePage(html);
    const header = document.getElementById('program-644');

    assert.ok(header.matches('div.alert'));
    assert.equal(header.classList.contains('cvvz-hidden'), false);
    assert.equal(header.previousElementSibling.matches('section'), false);
    assert.equal(document.querySelectorAll('section.cvvz-program').length, 109);
    assert.equal(warnings.length, 1);
    assert.deepEqual(structuredClone(warnings[0][1]), [{ id: 'program-644', reason: 'unknown row "Nový údaj"' }]);
});

test('a failing feature leaves its program untouched, including elements other features would move', () => {
    const { document, entries, warnings } = enhancePage(PAGE_2026, {
        beforeEnhance: (window) => window.registerFeature({
            page: 'program',
            name: 'broken',
            renderProgram(program) {
                if (program.id === '644') {
                    throw new Error('boom');
                }
            },
        }),
    });
    const original = entries.find((entry) => entry.program.id === '644').original;

    assert.equal(original.header.id, 'program-644');
    for (const element of hiddenOriginals(original)) {
        assert.equal(element.classList.contains('cvvz-hidden'), false);
    }
    assert.equal(original.terms.previousElementSibling.matches('div.modal'), true);
    assert.equal(document.querySelectorAll('section.cvvz-program').length, 109);
    assert.deepEqual(structuredClone(warnings[0][1]), [{ id: 'program-644', reason: 'program/broken: boom' }]);
});

test('a turned-off feature leaves its field as the site shows it, inside the section before the dates', () => {
    const { document, entries } = enhancePage(PAGE_2026, { disabledFeatures: ['program/description'] });
    const { original } = entries[0];
    const section = document.getElementById('program-644');

    assert.equal(original.tableContainer.parentElement, section);
    assert.equal(original.tableContainer.nextElementSibling, original.terms);
    assert.equal(isHidden(original.tableContainer), false);
    assert.equal(isHidden(original.fields.description), false);
    assert.equal(isHidden(original.fields.lecturers), true);
    assert.equal(isHidden(original.detailsRow), true, 'all rows in "Další podrobnosti" are shown by other features');
    assert.equal(section.querySelector('.cvvz-description'), null);
});

test('the rows in "Další podrobnosti" stay visible only for the turned-off features', () => {
    const { document, entries } = enhancePage(PAGE_2026, { disabledFeatures: ['program/labels'] });
    const { original } = entries[0];

    assert.equal(original.labels.parentElement, document.getElementById('program-644'));
    assert.equal(isHidden(original.labels), false);
    assert.equal(isHidden(original.detailsRow), false);
    assert.equal(isHidden(original.fields.physicalLevel), false);
    assert.equal(isHidden(original.fields.type), true, 'shown by the program-type feature');
});

for (const [name, html] of [['2026', PAGE_2026], ['2025', PAGE_2025]]) {
    test(`with all features, every section shows all information of its original block (${name})`, () => {
        const { document, entries } = enhancePage(html);

        assert.deepEqual(findIncompletePrograms(document, entries), []);
    });
}

for (const disabledFeatures of [...PROGRAM_FEATURE_IDS.map((id) => [id]), PROGRAM_FEATURE_IDS]) {
    test(`with ${disabledFeatures.join(', ')} turned off, every section still shows all information`, () => {
        const { document, entries } = enhancePage(PAGE_2026, { disabledFeatures });

        assert.deepEqual(findIncompletePrograms(document, entries), []);
    });
}
