registerFeature({
    page: 'site',
    name: 'confirm-unregister',
    label: 'Zeptat se před odhlášením z programu',

    enhancePage(document) {
        document.addEventListener('submit', (event) => {
            const question = unregisterQuestion(document, event.target);
            if (question && !window.confirm(question)) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }, true);
    },
});

function unregisterQuestion(document, form) {
    if (!form.matches('form[action="/unregister-program-timeblock"]')) {
        return null;
    }

    const term = form.closest('li[data-program-time-block-id]');
    if (term) {
        if (parseTermState(term) !== 'registered') {
            return null;
        }
        const title = term.closest('[data-program-id]').querySelector(':scope > .alert > span').textContent.trim();
        return unregisterQuestionText(title, term.querySelector('.ajax-modal.color-primary') !== null);
    }

    const id = form.querySelector('input[name="id"]').value;
    const row = [...document.querySelectorAll('.table-container > table tbody tr')]
        .find((row) => row.querySelector('form[action="/unregister-program-timeblock"] input[name="id"]')?.value === id);
    if (!row) {
        return null;
    }
    const entry = readScheduleRow(row);
    if (entry.watched) {
        return null;
    }
    return unregisterQuestionText(entry.program.title, entry.counts.registered >= entry.counts.capacity);
}

function unregisterQuestionText(title, full) {
    const question = `Opravdu se odhlásit z programu ${title}?`;
    return full ? `${question}\n\nProgram je plný, po odhlášení už nemusí být místo.` : question;
}
