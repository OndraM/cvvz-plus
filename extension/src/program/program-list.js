// Replaces each program of the program list with its new layout, built by the program features.
// Original elements are only hidden, never removed, and a program that fails to parse or render
// stays exactly as the site rendered it.

// Returns the programs left in their original form as [{ id, reason }].
function enhanceProgramList(features) {
    const { entries, failures } = parseProgramList(document);
    for (const { program, original } of entries) {
        try {
            replaceProgram(program, original, features);
        } catch (error) {
            failures.push({ id: original.header.id, reason: error.message });
        }
    }
    return failures;
}

function replaceProgram(program, original, features) {
    const layout = createProgramLayout(program);
    for (const feature of features) {
        try {
            feature.renderProgram?.(program, layout, original);
        } catch (error) {
            throw new Error(`${featureId(feature)}: ${error.message}`);
        }
    }

    // The page changes only from here on, once every feature rendered successfully.
    // The section takes over the id, so links to #program-ID keep working.
    layout.section.id = original.header.id;
    original.header.removeAttribute('id');
    original.header.before(layout.section);

    hideShownFields(original, features);
    // Fields of turned-off features stay as the site shows them, moved into the section so the program stays together.
    for (const element of [original.labels, original.tableContainer]) {
        if (element !== null && !isHiddenOriginal(element)) {
            layout.section.append(element);
        }
    }
    for (const { element, parent } of layout.moves) {
        parent.append(element);
    }
}

function hideShownFields(original, features) {
    const shownFields = new Set([...PROGRAM_LAYOUT_FIELDS, ...features.flatMap((feature) => feature.shows ?? [])]);
    for (const [field, element] of Object.entries(original.fields)) {
        if (shownFields.has(field)) {
            element.classList.add('cvvz-hidden');
        }
    }

    const fieldElements = Object.values(original.fields);
    for (const wrapper of [original.detailsRow, original.tableContainer]) {
        const wrapped = fieldElements.filter((element) => wrapper?.contains(element));
        if (wrapper !== null && wrapped.every(isHiddenOriginal)) {
            wrapper.classList.add('cvvz-hidden');
        }
    }
}

function isHiddenOriginal(element) {
    return element.classList.contains('cvvz-hidden');
}
