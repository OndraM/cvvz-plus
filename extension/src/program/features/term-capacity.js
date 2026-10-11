registerFeature({
    page: 'program',
    name: 'term-capacity',
    label: 'Upravit zobrazení volných míst a kapacity na srozumitelnější',

    enhancePage(document) {
        for (const item of document.querySelectorAll('.program-dates-dropdown .dropdown-item')) {
            formatTermTime(item.querySelector(':scope > span'));
            formatTermCapacity(item.querySelector('.ajax-modal'));
        }
    },
});

// The site writes the time as "sobota 08:00 až 09:30"; a text in any other form stays as the site shows it.
function formatTermTime(time) {
    const match = time?.textContent.trim().match(/^(\S+) (\d{1,2}):(\d\d) až (\d{1,2}):(\d\d)$/);
    if (!match) {
        return;
    }
    const [, day, fromHour, fromMinute, toHour, toMinute] = match;
    time.textContent = `${day[0].toUpperCase()}${day.slice(1)} ${Number(fromHour)}:${fromMinute}–${Number(toHour)}:${toMinute}`;
    time.classList.add('cvvz-term-time');
}

// "17/25/0" (registered / capacity / watching for a free place) -> "8 volných míst z 25".
function formatTermCapacity(counts) {
    const match = counts?.textContent.trim().match(/^(\d+)\/(\d+)\/(\d+)$/);
    if (!match) {
        return;
    }
    const [registered, capacity, watching] = match.slice(1).map(Number);
    const free = capacity - registered;
    const watchers = watching > 0 ? ` · ${watching} ${termWatchingVerb(watching)} volné místo` : '';
    counts.textContent = (free > 0 ? `${free} ${termFreePlacesNoun(free)} z ${capacity}` : `Plno, kapacita ${capacity}`) + watchers;
    counts.title = `Přihlášeno ${registered} z ${capacity}. Kliknutím zobrazíte seznam přihlášených.`;
    counts.parentElement.classList.add('cvvz-term-capacity');
}

function termFreePlacesNoun(count) {
    if (count === 1) {
        return 'volné místo';
    }
    return count <= 4 ? 'volná místa' : 'volných míst';
}

function termWatchingVerb(count) {
    return count >= 2 && count <= 4 ? 'hlídají' : 'hlídá';
}
