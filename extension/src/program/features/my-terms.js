registerFeature({
    page: 'program',
    name: 'my-terms',
    label: 'Zvýraznit přihlášené programy a hlídací psy',

    enhancePage(document) {
        document.querySelectorAll('[data-program-id]').forEach(markMyTerms);
        new MutationObserver((mutations) => {
            const programs = new Set(mutations.map((mutation) => mutation.target.closest('[data-program-id]')));
            programs.delete(null);
            programs.forEach(markMyTerms);
        }).observe(document.body, { childList: true, subtree: true });
    },
});

function markMyTerms(program) {
    const states = [...program.querySelectorAll('li[data-program-time-block-id]')].map((term) => {
        const state = parseTermState(term);
        term.classList.toggle('cvvz-registered', state === 'registered');
        term.classList.toggle('cvvz-watching', state === 'watching');
        return state;
    });
    const section = program.querySelector('section.cvvz-program');
    section?.classList.toggle('cvvz-registered', states.includes('registered'));
    section?.classList.toggle('cvvz-watching', states.includes('watching') && !states.includes('registered'));
}
