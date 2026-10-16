registerFeature({
    page: 'my-programs',
    name: 'pdf-export',
    label: 'Přesunout odkaz Export do PDF',

    enhancePage(document) {
        const link = document.querySelector('a[href="/moje-programy/pdf"]');
        const heading = link?.closest('.container')?.querySelector(':scope > h2');
        // The link's wrapper gets hidden, so it must hold nothing else.
        const wrapper = link?.parentElement;
        if (!heading || wrapper.children.length !== 1 || wrapper.textContent.trim() !== 'Export do PDF') {
            throw new Error('unexpected export link or page heading');
        }
        const row = buildElement('div', 'cvvz-pdf-export-row');
        heading.before(row);
        row.append(heading, link);
        wrapper.classList.add('cvvz-hidden');

        link.classList.add('cvvz-pdf-export');
        // On a phone, only "PDF" stays next to the icon, so the button fits next to the heading.
        link.replaceChildren(buildElement('span', 'cvvz-pdf-export-words', 'Export do '), 'PDF');
    },
});
