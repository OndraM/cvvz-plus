const SEARCH_TEXTS = new Map();

registerFeature({
    page: 'program',
    name: 'search',
    label: 'Fulltextové hledání v programech',

    renderProgram(program) {
        const texts = [
            program.title,
            program.perex,
            program.description,
            ...program.lecturers.map((lecturer) => lecturer.name),
            ...program.labels.map((label) => label.name),
        ];
        SEARCH_TEXTS.set(program.id, searchNormalize(texts.join(' ')));
    },

    enhancePage(document) {
        const heading = document.querySelector('.program-list-container h3');
        if (!heading) {
            throw new Error('heading not found');
        }
        const count = buildElement('span', 'cvvz-search-count');
        heading.append(' ', count);

        const input = buildElement('input', 'form-control');
        input.id = 'cvvz-search';
        input.type = 'text';
        input.placeholder = 'Hledat v názvech a v textu';
        input.autocomplete = 'off';
        input.enterKeyHint = 'search';
        const label = buildElement('label', '', 'Hledat v názvech a v textu');
        label.htmlFor = input.id;
        label.append(buildPlusBadge());
        const clear = buildElement('button', 'cvvz-search-clear', '×');
        clear.type = 'button';
        clear.setAttribute('aria-label', 'Smazat hledání');
        clear.hidden = true;

        const field = buildElement('div', 'col-12 form-floating');
        field.append(input, label, clear);
        const search = buildElement('div', 'cvvz-search row');
        search.append(field);
        heading.before(search);

        const update = () => {
            clear.hidden = input.value === '';
            searchPrograms(document, input.value, heading, count);
        };
        input.addEventListener('input', update);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                input.blur();
            }
        });
        clear.addEventListener('click', () => {
            input.value = '';
            update();
        });
    },
});

function searchPrograms(document, query, heading, count) {
    const words = searchNormalize(query).split(/\s+/).filter(Boolean);
    const programs = [...document.querySelectorAll('.program-list-container [data-program-id]')];
    let shown = 0;
    for (const program of programs) {
        const text = SEARCH_TEXTS.get(program.dataset.programId);
        const hidden = text !== undefined && !words.every((word) => text.includes(word));
        program.classList.toggle('cvvz-search-hidden', hidden);
        shown += hidden ? 0 : 1;
    }
    heading.classList.toggle('cvvz-searching', words.length > 0);
    count.textContent = `Zobrazeno ${shown} z ${programs.length} ${programs.length === 1 ? 'programu' : 'programů'}`;
}

function searchNormalize(text) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
