const PERMALINK_ICON_PATHS = {
    link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
    check: ['M20 6 9 17l-5-5'],
};

registerFeature({
    page: 'program',
    name: 'permalink',
    label: 'Po najetí myší zobrazit ikonu 🔗, která zkopíruje odkaz na program pro snazší sdílení',

    renderProgram(program, layout) {
        const link = buildElement('a', 'cvvz-permalink');
        link.href = `#program-${program.id}`;
        link.title = 'Zkopírovat odkaz na program';
        link.setAttribute('aria-label', 'Zkopírovat odkaz na program');
        link.append(renderPermalinkIcon('link'), renderPermalinkIcon('check'), buildElement('span', 'cvvz-permalink-done', 'Zkopírováno'));
        link.addEventListener('click', (event) => {
            event.preventDefault();
            copyProgramLink(link);
        });
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

function copyProgramLink(link) {
    navigator.clipboard.writeText(`${location.origin}${location.pathname}${link.hash}`).then(() => {
        link.classList.add('cvvz-copied');
        link.setAttribute('aria-label', 'Odkaz zkopírován');
        setTimeout(() => {
            link.classList.remove('cvvz-copied');
            link.setAttribute('aria-label', 'Zkopírovat odkaz na program');
        }, 2000);
    }, () => {
        // Without access to the clipboard, the link at least shows in the address bar.
        location.hash = link.hash;
    });
}

function renderPermalinkIcon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const attributes = {
        class: `cvvz-permalink-${name}`, viewBox: '0 0 24 24', width: '16', height: '16', fill: 'none',
        stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
    };
    for (const [attribute, value] of Object.entries(attributes)) {
        svg.setAttribute(attribute, value);
    }
    for (const d of PERMALINK_ICON_PATHS[name]) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.append(path);
    }
    return svg;
}
