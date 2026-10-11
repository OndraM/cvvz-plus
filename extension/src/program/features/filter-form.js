registerFeature({
    page: 'program',
    name: 'filter-form',
    description: 'Adds space between the filter form and the program list, which the site leaves without a margin.',

    enhancePage(document) {
        document.getElementById('program_filter_form')?.classList.add('cvvz-filter-form');
    },
});
