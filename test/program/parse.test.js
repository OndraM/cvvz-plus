import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, readFixture, runContentScripts } from '../helpers.js';

const PAGE_2026 = readFixture('program-2026-10.html');
const PAGE_2025 = readFixture('program-2025-11.html');

function parsePage(html) {
    const dom = createPage(html);
    runContentScripts(dom, ['src/program/parse.js']);
    const { entries, failures } = dom.window.parseProgramList(dom.window.document);
    // structuredClone turns objects from the page realm into plain objects comparable by assert.
    return { programs: structuredClone(entries.map((entry) => entry.program)), failures: structuredClone(failures) };
}

function findProgram(programs, id) {
    return programs.find((program) => program.id === id);
}

test('parses all programs of the 2026 page', () => {
    const { programs, failures } = parsePage(PAGE_2026);

    assert.deepEqual(failures, []);
    assert.equal(programs.length, 110);
});

test('parses details nested in "Další podrobnosti" (2026)', () => {
    const { programs } = parsePage(PAGE_2026);
    const { description, ...program } = findProgram(programs, '644');

    assert.deepEqual(program, {
        id: '644',
        title: '„Nabité“ rekvizity aneb nebojte se elektroniky',
        perex: 'Je libo tajemné vejce, které pípá při zatřesení, stroj času, či „ovládání reaktoru“ vyžadující neustále pozornost hráčů, jinak spouští sirénu? Ukážeme si, jak vyladit oddílové rekvizity aneb nebojte se jednoduché eletroniky.',
        labels: [],
        lecturers: [{
            name: 'Stanislav Sýkora',
            bioModalTarget: '#lecturerBioModal-462',
            programsUrl: '/program?program_filter%5Blecturer%5D=Stanislav%20S%C3%BDkora',
        }],
        type: 'Přednáška',
        physicalLevel: 'Malá',
        interactionLevel: 'Malá',
        difficulty: 'Základní znalosti',
        surcharge: '',
        termCount: 0,
    });
    assert.match(description, /^Elektronika skýtá řadu možností.*není potřeba žádná znalost programování, či něco podobného\.$/s);
});

test('parses labels and surcharge', () => {
    const { programs } = parsePage(PAGE_2026);

    assert.deepEqual(findProgram(programs, '682'), {
        id: '682',
        title: 'Šperky z lité pryskyřice',
        perex: 'Pojďte si vyzkoušet práci s umělou pryskyřicí a protože je dost času, tak si následující den budete moci odnést vlastní výrobek.',
        labels: [{ name: 'tvoření', color: 'rgb(185, 208, 17)' }],
        lecturers: [{
            name: 'Daniel Bartoš',
            bioModalTarget: '#lecturerBioModal-123',
            programsUrl: '/program?program_filter%5Blecturer%5D=Daniel%20Barto%C5%A1',
        }],
        description: 'Vyzkoušíme si odlévání a práci s epoxidovou pryskyřicí, vytvoříme si nějakou drobnost a budeme si povídat o tomto řemesle.',
        type: 'Rukodělná aktivita',
        physicalLevel: 'Velká',
        interactionLevel: 'Střední',
        difficulty: 'Základní znalosti',
        surcharge: '100',
        termCount: 0,
    });
});

test('parses the flat table, dates and programs without a lecturer (2025)', () => {
    const { programs, failures } = parsePage(PAGE_2025);

    assert.deepEqual(failures, []);
    assert.equal(programs.length, 298);
    assert.equal(findProgram(programs, '391').termCount, 13);

    const program = findProgram(programs, '299');
    assert.deepEqual(program.lecturers, []);
    assert.equal(program.type, 'Jiné');
    assert.equal(program.surcharge, 'ano');
});

test('a program with an unknown detail row fails, the others still parse', () => {
    const html = PAGE_2026.replace('<td>Míra náročnosti na interakci</td>', '<td>Nový údaj</td>');
    const { programs, failures } = parsePage(html);

    assert.deepEqual(failures, [{ id: 'program-644', reason: 'unknown row "Nový údaj"' }]);
    assert.equal(programs.length, 109);
});

test('a program with an unknown element in its block fails', () => {
    const html = PAGE_2026.replace(
        '<div class="table-container">',
        '<div class="alert alert-warning">Program zrušen</div><div class="table-container">',
    );

    assert.deepEqual(parsePage(html).failures, [{ id: 'program-644', reason: 'unknown element <div class="alert alert-warning">' }]);
});

test('a program with markup inside a text it reads fails, so no link is lost', () => {
    const linkInDescription = PAGE_2026.replace('Elektronika skýtá', '<a href="https://example.com">Elektronika</a> skýtá');
    assert.deepEqual(parsePage(linkInDescription).failures, [{ id: 'program-644', reason: 'unexpected markup in description' }]);

    const linkInPerex = PAGE_2026.replace('Ukážeme si, jak vyladit', 'Ukážeme si (<a href="https://example.com">video</a>), jak vyladit');
    assert.deepEqual(parsePage(linkInPerex).failures, [{ id: 'program-644', reason: 'unexpected markup in perex' }]);
});

test('a program with content the parser does not read fails, so nothing gets hidden unnoticed', () => {
    const badgeInHeader = PAGE_2026.replace(
        '<span class="fw-bold">„Nabité“ rekvizity aneb nebojte se elektroniky</span>',
        '<span class="fw-bold">„Nabité“ rekvizity aneb nebojte se elektroniky</span><span class="badge">Nový</span>',
    );
    assert.deepEqual(parsePage(badgeInHeader).failures, [{ id: 'program-644', reason: 'unexpected text "Nový"' }]);

    const noticeOutsideTable = PAGE_2026.replace('<div class="table-container">', '<div class="table-container"><p>Program zrušen</p>');
    assert.deepEqual(parsePage(noticeOutsideTable).failures, [{ id: 'program-644', reason: 'unexpected text "Program zrušen"' }]);

    const imageInLabels = PAGE_2026.replace('<div class="py-2 d-flex flex-wrap gap-1">', '<div class="py-2 d-flex flex-wrap gap-1"><img class="icon" src="/new.png">');
    assert.deepEqual(parsePage(imageInLabels).failures, [{ id: 'program-644', reason: 'unexpected element <img class="icon">' }]);

    const imageInToggle = PAGE_2026.replace('aria-controls="program-description-644">Detailní popis', 'aria-controls="program-description-644">Detailní popis<img src="/new.png">');
    assert.deepEqual(parsePage(imageInToggle).failures, [{ id: 'program-644', reason: 'unexpected element in "Detailní popis"' }]);

    const changedProgramsLink = PAGE_2026.replace('Zobrazit programy tohoto lektora', 'Zobrazit 3 programy tohoto lektora');
    assert.deepEqual(parsePage(changedProgramsLink).failures, [{ id: 'program-644', reason: 'unexpected text of the lecturer programs link' }]);
});

test('a program with a duplicate description fails', () => {
    const start = PAGE_2026.indexOf('<td colspan="2">');
    const descriptionCell = PAGE_2026.slice(start, PAGE_2026.indexOf('</td>', start) + '</td>'.length);
    const html = PAGE_2026.replace(descriptionCell, `${descriptionCell}</tr><tr>${descriptionCell}`);

    assert.deepEqual(parsePage(html).failures, [{ id: 'program-644', reason: 'duplicate description' }]);
});

test('finds nothing on a page without the program list', () => {
    const { programs, failures } = parsePage('<html><body><h1>Program</h1></body></html>');

    assert.deepEqual(programs, []);
    assert.deepEqual(failures, []);
});
