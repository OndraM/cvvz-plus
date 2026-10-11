registerFeature({
    page: 'participants',
    name: 'compact-table',
    label: 'Kompaktnější tabulka (nižší řádky, upravené šířky sloupců aj.)',

    enhancePage(document) {
        const table = findParticipantTable(document);
        table.parentElement.classList.add('cvvz-compact-table');

        const headings = participantCells(table.tHead.rows[0]);
        headings.firstName.classList.add('cvvz-name');
        headings.firstName.after(headings.paid);
        headings.lastName.classList.add('cvvz-hidden');
        headings.nickname.classList.add('cvvz-hidden');
        headings.organization.classList.add('cvvz-organization');
        headings.facebook.classList.add('cvvz-facebook');

        for (const cells of participantRows(table)) {
            joinParticipantName(cells);
            markParticipantPaid(cells.paid);
            cells.firstName.after(cells.paid);
            // A wrong long value (like a whole address) would not wrap and would stretch the whole table.
            cells.facebook.classList.replace('text-nowrap', 'cvvz-facebook');
        }
    },
});

function joinParticipantName({ firstName, lastName, nickname }) {
    const name = buildElement('span', 'cvvz-full-name');
    name.append(...firstName.childNodes, ' ', ...lastName.childNodes);
    firstName.append(name);
    firstName.classList.add('cvvz-name');
    if (nickname.textContent.trim()) {
        const nick = buildElement('span', 'cvvz-nickname');
        nick.append(...nickname.childNodes);
        firstName.append(nick);
    }
    lastName.classList.add('cvvz-hidden');
    nickname.classList.add('cvvz-hidden');
}

function markParticipantPaid(cell) {
    const paid = { Ano: true, Ne: false }[cell.textContent.trim()];
    if (paid === undefined) {
        return;
    }
    cell.textContent = paid ? '✓' : '✗';
    cell.title = paid ? 'Zaplaceno' : 'Nezaplaceno';
    cell.classList.add(paid ? 'cvvz-paid' : 'cvvz-unpaid');
}
