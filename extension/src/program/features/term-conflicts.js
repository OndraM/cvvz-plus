const TERM_CONFLICT_NOTES = {
    registered: 'V tu dobu máš: ',
    watching: 'V tu dobu hlídáš: ',
};

registerFeature({
    page: 'program',
    name: 'term-conflicts',
    label: 'Upozornit na souběh s přihlášeným programem',

    enhancePage(document) {
        let otherTerms = [];
        const mark = () => markTermConflicts(document, otherTerms);
        mark();
        new MutationObserver((mutations) => {
            if (mutations.some((mutation) => [...mutation.addedNodes, ...mutation.removedNodes].some(isTermChange))) {
                mark();
            }
        }).observe(document.body, { childList: true, subtree: true });

        if (document.location.search && document.querySelector('.logged-in-submenu a[href="/moje-programy"]')) {
            fetchMyProgramTerms().then((terms) => {
                otherTerms = terms;
                mark();
            }).catch((error) => {
                console.warn('CVVZ plus: některé části stránky zůstaly v původní podobě', [{ id: featureId(this), reason: error.message }]);
            });
        }
    },
});

function isTermChange(node) {
    return node.nodeType === Node.ELEMENT_NODE && node.matches('form.js-program-action, li[data-program-time-block-id], [data-program-id]');
}

function markTermConflicts(document, otherTerms) {
    const terms = [...document.querySelectorAll('[data-program-id] li[data-program-time-block-id]')];
    const myTerms = [
        ...terms.filter((term) => parseTermState(term) !== null).map(pageMyTerm),
        ...otherTerms.filter((myTerm) => !document.querySelector(`[data-program-id="${myTerm.programId}"]`)),
    ];
    for (const term of terms) {
        term.querySelectorAll('.cvvz-term-conflict').forEach((note) => note.remove());
        const time = termTime(term);
        const conflicts = myTerms.filter((myTerm) => myTerm.term !== term && myTerm.time === time);
        for (const myTerm of conflicts) {
            term.querySelector('.dropdown-item').append(buildConflictNote(myTerm));
        }
        const taken = conflicts.some((myTerm) => myTerm.state === 'registered');
        term.classList.toggle('cvvz-term-taken', taken && parseTermState(term) === null);
    }
}

function pageMyTerm(term) {
    const program = term.closest('[data-program-id]');
    return {
        term,
        state: parseTermState(term),
        time: termTime(term),
        title: program.querySelector(':scope > .alert > span').textContent.trim(),
        href: `#program-${program.dataset.programId}`,
    };
}

function fetchMyProgramTerms() {
    return fetch('/moje-programy').then((response) => response.text()).then((html) => {
        const table = findScheduleTable(new DOMParser().parseFromString(html, 'text/html'));
        return [...table.tBodies[0].rows].map(readScheduleRow).filter((entry) => entry.program).map((entry) => ({
            state: entry.watched ? 'watching' : 'registered',
            time: termTimeKey(entry.weekday, entry.start, entry.end),
            title: entry.program.title,
            href: entry.program.url,
            programId: entry.program.url.replace('/program#program-', ''),
        }));
    });
}

function termTime(term) {
    const text = term.querySelector('.dropdown-item > span').textContent.trim();
    const match = text.match(/^(\p{L}+) (\d{1,2}):(\d\d)\D+(\d{1,2}):(\d\d)$/u);
    if (!match) {
        return text;
    }
    const [, weekday, startHour, startMinute, endHour, endMinute] = match;
    return termTimeKey(weekday, startHour * 60 + Number(startMinute), endHour * 60 + Number(endMinute));
}

function termTimeKey(weekday, start, end) {
    return `${weekday.toLowerCase()} ${start}-${end % (24 * 60)}`;
}

function buildConflictNote(myTerm) {
    const note = buildElement('div', 'cvvz-term-conflict', TERM_CONFLICT_NOTES[myTerm.state]);
    const link = buildElement('a', '', myTerm.title);
    link.href = myTerm.href;
    note.append(link);
    return note;
}
