registerFeature({
    page: 'program',
    name: 'program-count',
    label: 'Zobrazit u nadpisu celkový počet vypsaných programů',

    enhancePage(document) {
        const heading = document.querySelector('.program-list-container h3');
        if (!heading) {
            throw new Error('heading not found');
        }
        // Each program is either its new section, or its original header when it stayed as the site shows it.
        const count = document.querySelectorAll('.program-list-container section.cvvz-program, .program-list-container div.alert[id^="program-"]').length;
        heading.append(' ', buildElement('span', 'cvvz-program-count', `${count} ${programCountNoun(count)}`));
    },
});

function programCountNoun(count) {
    if (count === 1) {
        return 'program';
    }
    return count >= 2 && count <= 4 ? 'programy' : 'programů';
}
