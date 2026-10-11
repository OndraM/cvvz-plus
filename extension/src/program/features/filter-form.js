registerFeature({
    page: 'program',
    name: 'filter-form',
    label: 'Odsadit filtr od seznamu programů pro lepší přehlednost',

    enhancePage(document) {
        document.getElementById('program_filter_form')?.classList.add('cvvz-filter-form');
    },
});
