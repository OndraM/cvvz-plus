// Reads the program list from the page into the data model all program features work with.
//
// parseProgramList(document) returns { entries: [{ program, original }], failures: [{ id, reason }] }:
//   program  - plain data, see parseProgramBlock
//   original - the program's elements on the page: { header, perex, labels, tableContainer, terms }
//
// Parsing is strict: anything unexpected in a program block makes it fail, and the block then
// stays in its original HTML, so the extension never hides information it does not understand.

const PARSE_DETAIL_FIELDS = {
    'Provedení': 'type',
    'Míra fyzického zapojení účastníků': 'physicalLevel',
    'Míra náročnosti na interakci': 'interactionLevel',
    'Úroveň obtížnosti programu': 'difficulty',
    'Doplatek na místě': 'surcharge',
};

const PARSE_HEADER_SELECTOR = 'div.alert[id^="program-"]';

function parseProgramList(root) {
    const entries = [];
    const failures = [];
    for (const header of root.querySelectorAll(`.program-list-container ${PARSE_HEADER_SELECTOR}`)) {
        try {
            entries.push(parseProgramBlock(header));
        } catch (error) {
            failures.push({ id: header.id, reason: error.message });
        }
    }
    return { entries, failures };
}

function parseProgramBlock(header) {
    const id = header.id.match(/^program-(\d+)$/)?.[1];
    if (!id) {
        throw new Error(`unexpected header id "${header.id}"`);
    }

    const original = { header, perex: null, labels: null, tableContainer: null, terms: null };
    for (const sibling of parseBlockSiblings(header)) {
        const kind = parseSiblingKind(sibling);
        if (kind === 'modal') {
            continue;
        }
        if (kind === null) {
            throw new Error(`unknown element ${parseDescribeElement(sibling)}`);
        }
        if (original[kind] !== null) {
            throw new Error(`duplicate ${kind} element`);
        }
        original[kind] = sibling;
    }
    if (original.tableContainer === null) {
        throw new Error('missing table container');
    }

    const read = new Set(); // elements whose whole content the parser read into `program`
    const program = {
        id,
        title: parseTitle(header, read),
        perex: original.perex ? parseText(original.perex, read, 'perex') : null,
        labels: parseLabels(original.labels, read),   // [{ name, color }]
        lecturers: [],                                 // [{ name, bioModalTarget, programsUrl }]
        description: null,
        type: null,
        physicalLevel: null,
        interactionLevel: null,
        difficulty: null,
        surcharge: null,
        termCount: parseTermCount(original.terms),   // null when the program has no dates element
    };
    parseTable(original.tableContainer, program, read);

    for (const element of programElementsToHide(original)) {
        parseCheckAllRead(element, read);
    }
    return { program, original };
}

function programElementsToHide(original) {
    return [original.header, original.perex, original.labels, original.tableContainer].filter(Boolean);
}

function parseBlockSiblings(header) {
    const siblings = [];
    for (let element = header.nextElementSibling; element && !element.matches(PARSE_HEADER_SELECTOR); element = element.nextElementSibling) {
        siblings.push(element);
    }
    return siblings;
}

function parseSiblingKind(element) {
    if (element.matches('p')) {
        return 'perex';
    }
    if (element.matches('div.d-flex.flex-wrap')) {
        return 'labels';
    }
    if (element.matches('div.table-container')) {
        return 'tableContainer';
    }
    if (element.matches('div.modal')) {
        return 'modal';
    }
    if (element.matches('div.row') && element.querySelector('.program-dates-dropdown')) {
        return 'terms';
    }
    return null;
}

function parseTitle(header, read) {
    const titleElement = header.querySelector(':scope > span');
    if (titleElement === null) {
        throw new Error('missing title');
    }
    const title = parseText(titleElement, read, 'title');
    if (title === '') {
        throw new Error('empty title');
    }
    return title;
}

function parseLabels(container, read) {
    if (container === null) {
        return [];
    }
    return [...container.querySelectorAll(':scope > span.badge')].map((badge) => ({
        name: parseText(badge, read, 'label'),
        color: badge.style.backgroundColor,
    }));
}

function parseTermCount(termsRow) {
    if (termsRow === null) {
        return null;
    }
    const menu = termsRow.querySelector('.program-dates-dropdown .dropdown-menu');
    if (menu === null) {
        throw new Error('missing dates menu');
    }
    return menu.querySelectorAll(':scope > li').length;
}

// Handles both the flat table (2025) and rows nested in the "Další podrobnosti" collapse (2026),
// because every row in the container is visited, however deep it is.
function parseTable(tableContainer, program, read) {
    const seenKeys = new Set();
    for (const row of tableContainer.querySelectorAll('tr')) {
        const cells = [...row.children];
        if (!cells.every((cell) => cell.tagName === 'TD')) {
            throw new Error('unexpected table row');
        }

        if (cells.length === 2) {
            const key = parseText(cells[0], read, 'row name');
            if (seenKeys.has(key)) {
                throw new Error(`duplicate row "${key}"`);
            }
            seenKeys.add(key);
            parseDetailRow(key, cells[1], program, read);
        } else if (cells.length === 1 && cells[0].colSpan === 2) {
            parseCollapseRow(cells[0], program, read);
        } else {
            throw new Error('unexpected table row');
        }
    }
}

function parseDetailRow(key, valueCell, program, read) {
    if (key === 'Lektor') {
        program.lecturers = parseLecturers(valueCell, read);
    } else if (Object.hasOwn(PARSE_DETAIL_FIELDS, key)) {
        program[PARSE_DETAIL_FIELDS[key]] = parseText(valueCell, read, `row "${key}"`);
    } else {
        throw new Error(`unknown row "${key}"`);
    }
}

// A collapsible row is either the description, or "Další podrobnosti", a wrapper of a nested
// table whose rows parseTable visits itself.
function parseCollapseRow(cell, program, read) {
    const container = cell.querySelector(':scope > .collapsing-form-container');
    const toggle = container?.querySelector(':scope > a.toggle-area');
    const content = container?.querySelector(':scope > .collapse');
    if (!toggle || !content) {
        throw new Error('unexpected collapsible row');
    }

    const title = toggle.textContent.trim();
    if (title === 'Detailní popis') {
        if (program.description !== null) {
            throw new Error('duplicate description');
        }
        program.description = parseText(content, read, 'description');
    } else if (title !== 'Další podrobnosti') {
        throw new Error(`unknown collapsible row "${title}"`);
    }
    read.add(toggle);
}

// The cell holds pairs of links: lecturer name (opens the bio modal) and "Zobrazit programy tohoto lektora".
function parseLecturers(cell, read) {
    const links = [...cell.querySelectorAll(':scope > a')];
    if (links.length % 2 !== 0) {
        throw new Error('unexpected links in "Lektor"');
    }

    const lecturers = [];
    for (let i = 0; i < links.length; i += 2) {
        const [bioLink, programsLink] = [links[i], links[i + 1]];
        const programsUrl = programsLink.getAttribute('href') ?? '';
        if (bioLink.dataset.bsToggle !== 'modal' || !bioLink.dataset.bsTarget || !programsUrl.startsWith('/program?')) {
            throw new Error('unexpected links in "Lektor"');
        }
        lecturers.push({
            name: parseText(bioLink, read, 'lecturer name'),
            bioModalTarget: bioLink.dataset.bsTarget,
            programsUrl,
        });
        // Its text "Zobrazit programy tohoto lektora" is replaced by the lecturer feature.
        read.add(programsLink);
    }
    return lecturers;
}

// Reads an element that holds plain text only, so nothing like a link is lost by reading just the text.
function parseText(element, read, what) {
    if (element.children.length !== 0) {
        throw new Error(`unexpected markup in ${what}`);
    }
    read.add(element);
    return element.textContent.trim();
}

// Elements that carry information or behavior even without any text.
const PARSE_CONTENT_ELEMENTS = 'a, img, svg, picture, video, audio, iframe, object, embed, canvas, form, input, select, textarea, button';

// Makes sure nothing gets hidden that the parser did not read: every non-blank text and every content
// element (link, image, form control...) in `node` must be inside an element the parser read.
// Other elements (div, table, br...) are just wrappers.
function parseCheckAllRead(node, read) {
    if (read.has(node)) {
        return;
    }
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
        throw new Error(`unexpected text "${node.textContent.trim().slice(0, 40)}"`);
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches(PARSE_CONTENT_ELEMENTS)) {
            throw new Error(`unexpected element ${parseDescribeElement(node)}`);
        }
        for (const child of node.childNodes) {
            parseCheckAllRead(child, read);
        }
    }
}

function parseDescribeElement(element) {
    return `<${element.tagName.toLowerCase()} class="${element.getAttribute('class') ?? ''}">`;
}
