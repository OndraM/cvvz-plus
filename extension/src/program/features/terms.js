registerFeature({
    page: 'program',
    name: 'terms',
    description: 'Shows the program dates (termíny) as a list directly in the program instead of the '
        + '"Zobrazit termíny programu" dropdown, or a message when the program has no dates yet.',

    renderProgram(program, layout, original) {
        if (original.terms === null) {
            return;
        }
        if (program.termCount === 0) {
            layout.section.append(buildElement('p', 'cvvz-no-terms', '🚫 Program zatím nemá vypsané žádné termíny'));
        }
        // Moved, not re-created: the site binds click listeners (list of participants) directly to these
        // elements, and the dates of a logged-in user can contain buttons this extension does not know about.
        // The dropdown is turned into a list by terms.css.
        layout.moveOriginal(original.terms, layout.section);
    },
});
