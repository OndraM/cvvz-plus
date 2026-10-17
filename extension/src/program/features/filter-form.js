registerFeature({
    page: 'program',
    name: 'filter-form',
    label: 'Zmenšit vyhledávací formulář a odsadit ho od seznamu programů',

    enhancePage(document) {
        document.getElementById('program_filter_form')?.classList.add('cvvz-filter-form');
    },
});
