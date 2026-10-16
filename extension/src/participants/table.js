// The participant list: a table of the site with a row of each participant, which features change in place.
// Features hide, move or change the cells, but never add or remove them.

// Keys of the columns, with their headings on the site.
const PARTICIPANT_COLUMNS = {
    id: 'ID',
    firstName: 'Jméno',
    lastName: 'Příjmení',
    nickname: 'Přezdívka',
    degree: 'Stupeň BL',
    organization: 'Organizace',
    city: 'Město',
    facebook: 'FB',
    phone: 'Tel',
    email: 'E-mail',
    paid: 'Zaplaceno',
};

function findParticipantTable(document) {
    const table = document.querySelector('.table-container > table');
    if (!table) {
        throw new Error('participant table not found');
    }
    return markParticipantTable(table);
}

// The first call checks the headings, before any feature changes them, and marks each cell with the key
// of its column, so features find the cells also after others moved them. When the site changed the columns,
// it throws, so the features leave the table as the site shows it.
function markParticipantTable(table) {
    if (!table.classList.contains('cvvz-participants')) {
        const headings = [...table.querySelectorAll('thead th')].map((heading) => heading.textContent.trim()).join(', ');
        if (headings !== Object.values(PARTICIPANT_COLUMNS).join(', ')) {
            throw new Error(`unexpected columns: ${headings}`);
        }
        const keys = Object.keys(PARTICIPANT_COLUMNS);
        for (const row of table.rows) {
            [...row.cells].forEach((cell, index) => {
                cell.dataset.cvvzColumn = keys[index];
            });
        }
        table.classList.add('cvvz-participants');
    }
    return table;
}

// The site adds the modal with the participants of a program's term only after a click on its capacity, with a table
// of the registered participants and possibly another of those watching for a free place. That is after main.js ran,
// so failures are reported here.
function watchParticipantModals(document, feature, enhanceTable) {
    new MutationObserver((mutations) => {
        const modals = mutations.flatMap((mutation) => [...mutation.addedNodes]).filter((node) => node.matches?.('.modal'));
        for (const modal of modals) {
            try {
                for (const table of modal.querySelectorAll('.table-container > table')) {
                    enhanceTable(markParticipantTable(table));
                }
            } catch (error) {
                console.warn('CVVZ plus: některé části stránky zůstaly v původní podobě', [{ id: featureId(feature), reason: error.message }]);
            }
        }
    }).observe(document.body, { childList: true });
}

// Cells of a row (or of the heading row) by the keys of PARTICIPANT_COLUMNS.
function participantCells(row) {
    return Object.fromEntries([...row.cells].map((cell) => [cell.dataset.cvvzColumn, cell]));
}

function participantRows(table) {
    return [...table.tBodies[0].rows].map(participantCells);
}
