registerFeature({
    page: 'program',
    name: 'lecturer',
    description: 'Shows each lecturer on one line: the name opens the lecturer bio (as on the site), '
        + 'followed by a link to search all programs of the lecturer.',

    renderProgram(program, layout) {
        for (const lecturer of program.lecturers) {
            // Bootstrap on the page opens the bio modal through its delegated data-bs-toggle handler.
            const nameLink = buildElement('a', '', lecturer.name);
            nameLink.href = '#';
            nameLink.dataset.bsToggle = 'modal';
            nameLink.dataset.bsTarget = lecturer.bioModalTarget;

            const programsLink = buildElement('a', '', '🔍 Vyhledat všechny programy lektora');
            programsLink.href = lecturer.programsUrl;

            const line = buildElement('p', 'cvvz-lecturer');
            line.append(buildElement('strong', '', 'Lektor:'), ' ', nameLink, ' (', programsLink, ')');
            layout.section.append(line);
        }
    },
});
