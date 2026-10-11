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
            throw new Error(`${feature.page}/${feature.name}: ${error.message}`);
        }
    }

    // The page changes only from here on, once every feature rendered successfully.
    // The section takes over the id, so links to #program-ID keep working.
    layout.section.id = original.header.id;
    original.header.removeAttribute('id');
    original.header.before(layout.section);
    for (const { element, parent } of layout.moves) {
        parent.append(element);
    }
    for (const element of programElementsToHide(original)) {
        element.classList.add('cvvz-hidden');
    }
}
