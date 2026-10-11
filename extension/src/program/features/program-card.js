registerFeature({
    page: 'program',
    name: 'program-card',
    label: 'Zobrazit každý program v ohraničené kartě (pro lepší vizuální přehlednost)',

    renderProgram(program, layout) {
        layout.section.classList.add('cvvz-card');
    },
});
