registerFeature({
    page: 'my-programs',
    name: 'all-programs-link',
    label: 'Přidat k nadpisu odkaz na všechny programy',

    enhancePage(document) {
        const heading = document.querySelector('h2.color-primary');
        if (heading?.textContent.trim() !== 'Moje programy') {
            throw new Error('page heading not found');
        }
        const link = buildElement('a', 'cvvz-all-programs', 'Všechny programy');
        link.href = '/program';
        heading.after(link);
    },
});
