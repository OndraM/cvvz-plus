const PROGRAM_LAYOUT_FIELDS = ['title', 'perex'];

// The common layout of one program that all program features build on.
// The title is a heading below the page's "Seznam programů" (h3), so screen reader users can jump between programs.
// Features add their parts to `layout.header` or `layout.section`. The layout replaces the original
// program block only after all features rendered without an error (see program-list.js).
function createProgramLayout(program) {
    const section = buildElement('section', 'cvvz-program');
    const header = buildElement('div', 'cvvz-header');
    header.append(buildElement('h4', 'cvvz-title', program.title));
    section.append(header);
    if (program.perex) {
        section.append(buildElement('p', 'cvvz-perex', program.perex));
    }

    const moves = [];
    return {
        section,
        header,
        moves,
        // For original elements that must not be re-created, because the site binds listeners to them.
        // The move happens only when the whole layout is put on the page, so a failing feature
        // leaves the page untouched.
        moveOriginal(element, parent) {
            moves.push({ element, parent });
        },
    };
}
