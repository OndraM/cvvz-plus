registerFeature({
    page: 'program',
    name: 'permalink',
    description: 'Adds a 🔗 link to the program into its header (shown on hover, always on touch screens). '
        + 'When the page is opened with such a link, it scrolls to the program again, because the layout changed after the browser scrolled.',

    renderProgram(program, layout) {
        const link = buildElement('a', 'cvvz-permalink', '🔗');
        link.href = `#program-${program.id}`;
        link.title = 'Odkaz na tento program';
        link.setAttribute('aria-label', 'Odkaz na tento program');
        layout.header.append(' ', link);
    },

    enhancePage(document) {
        const hash = document.location.hash;
        const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
        if (target?.classList.contains('cvvz-program')) {
            target.scrollIntoView();
        }
    },
});
