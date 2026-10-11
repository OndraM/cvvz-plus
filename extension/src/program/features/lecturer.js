registerFeature({
    page: 'program',
    name: 'lecturer',
    label: 'Odkaz na další programy lektora je na jednom řádku za jménem lektora',
    shows: ['lecturers'],

    renderProgram(program, layout) {
        for (const lecturer of program.lecturers) {
            // Bootstrap on the page opens the bio modal through its delegated data-bs-toggle handler.
            const nameLink = buildElement('a', '', lecturer.name);
            nameLink.href = '#';
            nameLink.dataset.bsToggle = 'modal';
            nameLink.dataset.bsTarget = lecturer.bioModalTarget;

            const programsLink = buildElement('a', 'cvvz-lecturer-programs', 'další programy lektora');
            programsLink.href = lecturer.programsUrl;

            const line = buildElement('p', 'cvvz-lecturer');
            line.append('👤 ', nameLink, ' · ', programsLink);
            layout.section.append(line);
        }
    },
});
