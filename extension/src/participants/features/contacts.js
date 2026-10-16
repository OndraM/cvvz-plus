registerFeature({
    page: 'participants',
    name: 'contacts',
    label: 'Zobrazit FB, telefon a e-mail v jednom sloupci jako ikonky',

    enhanceSite(document) {
        watchParticipantModals(document, this, showParticipantContacts);
    },

    enhancePage(document) {
        showParticipantContacts(findParticipantTable(document));
    },
});

function showParticipantContacts(table) {
    const headings = participantCells(table.tHead.rows[0]);
    headings.facebook.textContent = 'Kontakt';
    headings.phone.classList.add('cvvz-hidden');
    headings.email.classList.add('cvvz-hidden');

    for (const { facebook, phone, email } of participantRows(table)) {
        const links = buildElement('span', 'cvvz-contacts');
        // The site shows the Facebook value after a slash, also when it is empty.
        const facebookValue = facebook.textContent.trim().replace(/^\//, '');
        if (facebookValue) {
            links.append(buildContactLink('facebook', `Facebook: ${facebookValue}`, facebookUrl(facebookValue)));
        }
        const phoneNumber = phone.textContent.trim();
        if (phoneNumber) {
            links.append(buildContactLink('phone', `Telefon: ${phoneNumber}`, `tel:${phoneNumber.replace(/[^\d+]/g, '')}`));
        }
        const emailAddress = email.textContent.trim();
        if (emailAddress) {
            links.append(buildContactLink('email', `E-mail: ${emailAddress}`, `mailto:${emailAddress}`));
        }

        for (const element of facebook.children) {
            element.classList.add('cvvz-hidden');
        }
        facebook.append(links);
        phone.classList.add('cvvz-hidden');
        email.classList.add('cvvz-hidden');
    }
}

function buildContactLink(type, title, href) {
    const link = buildElement('a', `cvvz-contact cvvz-contact-${type}`);
    link.title = title;
    link.href = href;
    return link;
}

// Participants fill in Facebook freely: a profile name, a whole address, or just their name to search for.
// Only addresses on Facebook become links as they are.
function facebookUrl(value) {
    if (/^(https?:\/\/)?([\w-]+\.)?(facebook|fb)\.com\//i.test(value)) {
        return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    }
    if (/^[\w.\-/?=]+$/.test(value)) {
        return `https://www.facebook.com/${value}`;
    }
    return `https://www.facebook.com/search/top?q=${encodeURIComponent(value)}`;
}
