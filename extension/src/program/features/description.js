const DESCRIPTION_WORD_LIMIT = 25;

registerFeature({
    page: 'program',
    name: 'description',
    description: `Shows the detailed description directly instead of the collapsed "Detailní popis". `
        + `A longer one is shortened to ${DESCRIPTION_WORD_LIMIT} words; the "» Více" button (or a click on the text) shows all of it, `
        + `"« Méně" shortens it again.`,

    renderProgram(program, layout) {
        if (program.description) {
            layout.section.append(renderDescription(program.description, program.id));
        }
    },
});

function renderDescription(fullText, programId) {
    const paragraph = buildElement('p', 'cvvz-description');
    const words = fullText.split(/\s+/);
    if (words.length <= DESCRIPTION_WORD_LIMIT) {
        paragraph.textContent = fullText;
        return paragraph;
    }

    const shortText = `${words.slice(0, DESCRIPTION_WORD_LIMIT).join(' ')}…`;
    const text = buildElement('span', 'cvvz-description-text');
    text.id = `cvvz-description-${programId}`;

    // A button that stays in place, so keyboard focus is not lost when the text changes.
    const toggle = buildElement('button', 'cvvz-more');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', text.id);
    paragraph.append(text, ' ', toggle);

    const setExpanded = (expanded) => {
        text.textContent = expanded ? fullText : shortText;
        toggle.textContent = expanded ? '« Méně' : '» Více';
        toggle.setAttribute('aria-expanded', String(expanded));
        paragraph.classList.toggle('cvvz-truncated', !expanded);
    };
    toggle.addEventListener('click', () => setExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
    text.addEventListener('click', () => setExpanded(true));
    setExpanded(false);

    return paragraph;
}
