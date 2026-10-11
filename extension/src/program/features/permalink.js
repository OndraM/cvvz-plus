registerFeature({
    page: 'program',
    name: 'permalink',
    label: 'Přidat po najetí myší odkaz 🔗 na program v záhlaví pro snazší sdílení',

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
