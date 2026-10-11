const DESCRIPTION_WORD_LIMIT = 25;

registerFeature({
    page: 'program',
    name: 'description',
    label: 'Detailní popis má rovnou zobrazený úryvek, zbytek po kliknutí',
    shows: ['description'],

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
        toggle.textContent = expanded ? '« Zkrátit popis' : '» Celý popis';
        toggle.setAttribute('aria-expanded', String(expanded));
    };
    const switchExpanded = () => setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
    toggle.addEventListener('click', switchExpanded);
    text.addEventListener('click', switchExpanded);
    setExpanded(false);

    return paragraph;
}
