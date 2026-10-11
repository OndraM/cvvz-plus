registerFeature({
    page: 'program',
    name: 'program-card',
    label: 'Zobrazit každý program v ohraničené kartě',

    renderProgram(program, layout) {
        layout.section.classList.add('cvvz-card');
    },
});
