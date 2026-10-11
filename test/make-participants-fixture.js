// Saves the live participant list as a test fixture, with made-up people instead of the real ones:
// node test/make-participants-fixture.js > test/fixtures/participants-RRRR-MM.html

import { JSDOM } from 'jsdom';

// ID, Jméno, Příjmení, Přezdívka, Stupeň BL, Organizace, Město, FB (null when not filled in), Tel, E-mail, Zaplaceno
const PARTICIPANTS = [
    ['101', 'Jan', 'Testovací', 'Tester', '7', 'Spolek Ukázka, z.s.', 'Kolín', '/jan.testovaci.56', '777000101', 'jan.testovaci@example.com', 'Ano'],
    ['102', 'Eva', 'Ukázková', '', '', '', 'Brno', null, '', '', 'Ano'],
    ['103', 'Petr', 'Vzorový', 'Vzorek', '2', 'Základní článek Hnutí Ukázka - turistický oddíl s opravdu hodně dlouhým názvem, z.s.', 'České Budějovice', '/https://m.facebook.com/profile.php?id=100000000000103', '', '', 'Ne'],
    ['104', 'Marie', 'Příkladná', 'Máňa', '1', 'Turistický oddíl Příklad', 'Pardubice', '/Marie Příkladná', '+420 777 000 104', '', 'Ano'],
    ['105', 'Karel', 'Pokusný', '', '12', 'Oddíl Pokus, p.s.', 'Ostrava (okr. Ostrava-město)', '/profile.php?id=100000000000105', '', 'karel@example.com', 'Ne'],
    ['106', 'Lucie', 'Zkušební', 'Lucka', '', 'Spolek Ukázka, z.s.', 'Kolín', '/fb.com/lucie.zkusebni', '777000106', '', 'Ano'],
    ['107', 'Tomáš', 'Fiktivní', '', '', '', 'Jihlava', '/share/AbCdEf0107/', '', '', 'Ano'],
    ['108', 'Jana', 'Smyšlená', '', '3', 'Oddíl Pokus, p.s.', 'Brno', '/Instagram: @jana.smyslena', '', '', 'Ano'],
    ['109', '', 'Bezejmenná', '', '', '', 'Praha', '/', '', '', 'Ne'],
];

const dom = new JSDOM(await (await fetch('https://www.cvvz.cz/prihlaseni-ucastnici')).text());
const { document } = dom.window;

// Each row copies a real row with the site's Facebook icon, and gets all its texts replaced.
const template = document.querySelector('tbody svg').closest('tr');
document.querySelector('tbody').replaceChildren(...PARTICIPANTS.map((participant) => {
    const row = template.cloneNode(true);
    participant.forEach((value, column) => {
        const cell = row.cells[column];
        if (value === null) {
            cell.replaceChildren();
        } else {
            (cell.querySelector('span') ?? cell).textContent = value;
        }
    });
    return row;
}));
// The filter offers real cities and organizations.
for (const select of document.querySelectorAll('select')) {
    select.replaceChildren(select.options[0]);
}

process.stdout.write(dom.serialize());
