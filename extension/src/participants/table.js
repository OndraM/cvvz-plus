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

// The first call checks the headings, before any feature changes them, and marks each cell with the key
// of its column, so features find the cells also after others moved them. When the site changed the columns,
// it throws, so the features leave the table as the site shows it.
function findParticipantTable(document) {
    const table = document.querySelector('.table-container > table');
    if (!table) {
        throw new Error('participant table not found');
    }
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

// Cells of a row (or of the heading row) by the keys of PARTICIPANT_COLUMNS.
function participantCells(row) {
    return Object.fromEntries([...row.cells].map((cell) => [cell.dataset.cvvzColumn, cell]));
}

function participantRows(table) {
    return [...table.tBodies[0].rows].map(participantCells);
}
