// Statistics of the participants in a tab next to their list. They count the rows of the table,
// so with the site's filter, they are statistics of the filtered participants.
// It reads the table before the other participant features change it (paid is "Ano" or "Ne"), so it goes first in the manifest.

const STATS_URL = '/prihlaseni-ucastnici#statistiky';
const STATS_HASH = '#statistiky';

const STATS_MODES = [
    { label: 'Všichni', noun: 'přihlášených', includes: () => true },
    { label: 'Zaplacení', noun: 'zaplacených', includes: (participant) => participant.paid },
    { label: 'Nezaplacení', noun: 'nezaplacených', includes: (participant) => !participant.paid },
];

// Big organizations, whose units (groups, clubs...) participants name each by its own name, counted together.
// `prefix` is the part of a unit's name the organization's name already says, `unit` the noun for 1, 2-4 and 5+ units.
const STATS_ORGANIZATION_GROUPS = [
    { name: 'Pionýr', pattern: /^Pionýr\b/i, prefix: /^Pionýr,\s*z\.\s*s\.\s*-\s*/i, unit: ['skupina', 'skupiny', 'skupin'] },
    { name: 'Hnutí Brontosaurus', pattern: /brontosaurus/i, prefix: /^Základní článek hnutí Brontosaurus\s+/i, unit: ['článek', 'články', 'článků'] },
    { name: 'Duha', pattern: /^Duha\b/, unit: ['klub', 'kluby', 'klubů'] },
    { name: 'Česká tábornická unie', pattern: /^Česká tábornická unie/, prefix: /^Česká tábornická unie\s*-\s*/, unit: ['klub', 'kluby', 'klubů'] },
    { name: 'Asociace TOM', pattern: /\bTOM \d/, prefix: /^Asociace (TOM ČR|turistických oddílů (mládeže )?ČR),\s*/, unit: ['oddíl', 'oddíly', 'oddílů'] },
    { name: 'Junák – český skaut', pattern: /^Junák\b/, prefix: /^Junák\s*-\s*český skaut,\s*/, unit: ['středisko', 'střediska', 'středisek'] },
    { name: 'ČSOP a Mladí ochránci přírody', pattern: /ČSOP|Mladí ochránci přírody/, unit: ['organizace', 'organizace', 'organizací'] },
    { name: 'Hasiči (SH ČMS)', pattern: /^SH ČMS/, prefix: /^SH ČMS\s*-\s*/, unit: ['sbor', 'sbory', 'sborů'] },
];
const STATS_LEGAL_FORM = /,?\s*(z\.\s?s\.|p\.\s?s\.|z\.\s?ú\.|příspěvková organizace)$/i;

const STATS_GROUP_SIZES = [
    { name: '1 člověk', min: 1, max: 1 },
    { name: '2–4 lidé', min: 2, max: 4 },
    { name: '5–9 lidí', min: 5, max: 9 },
    { name: '10 a více', min: 10, max: Infinity },
];

// Rankings show this many items, the others after a click.
const STATS_RANKING_LIMIT = 10;

const STATS_ORGANIZATION_NOUN = ['organizace', 'organizace', 'organizací'];
const STATS_CITY_NOUN = ['město', 'města', 'měst'];

registerFeature({
    page: 'participants',
    name: 'stats',
    label: 'Přidá podstránku Statistiky účastníků do záložky vedle seznamu účastníků, přidá odkaz do menu',

    // The site's menu link "Statistiky účastníků" leads to a "coming soon" page, so while it leads there, it is grayed out.
    // A link to the statistics comes after the link to the participant list. The footer link always leads to the statistics.
    enhanceSite(document) {
        for (const link of statsSiteLinks(document, 'header a.dropdown-item')) {
            link.classList.toggle('cvvz-stats-coming-soon', link.pathname === '/pripravujeme');
        }
        const participantsLinks = [...document.querySelectorAll('header a.dropdown-item')].filter((link) => link.pathname === '/prihlaseni-ucastnici');
        for (const participantsLink of participantsLinks) {
            const link = buildElement('a', 'dropdown-item', 'Statistiky účastníků');
            link.setAttribute('href', STATS_URL);
            link.append(buildStatsPlus());
            const item = buildElement('li');
            item.append(link);
            participantsLink.parentElement.after(item);
        }
        for (const link of statsSiteLinks(document, 'footer a')) {
            link.setAttribute('href', STATS_URL);
            link.append(buildStatsPlus());
        }
    },

    enhancePage(document) {
        const table = findParticipantTable(document);
        const participants = readStatsParticipants(table);
        const list = table.closest('.table-container').parentElement;
        const stats = buildStatsPanel(participants, document.location);
        list.before(buildStatsTabs(list, stats, participants.length), stats);
    },
});

function statsSiteLinks(document, selector) {
    return [...document.querySelectorAll(selector)].filter((link) => link.textContent.trim() === 'Statistiky účastníků');
}

// The sign of the extension, as next to the site's logo: the statistics are not a page of the site.
function buildStatsPlus() {
    const plus = buildElement('span', 'cvvz-plus cvvz-stats-plus');
    plus.title = 'Přidáno rozšířením CVVZ plus';
    return plus;
}

function readStatsParticipants(table) {
    const participants = participantRows(table).map((cells) => {
        const paid = { Ano: true, Ne: false }[cells.paid.textContent.trim()];
        if (paid === undefined) {
            throw new Error(`unexpected paid value: ${cells.paid.textContent.trim()}`);
        }
        const degree = Number.parseInt(cells.degree.textContent, 10);
        return {
            paid,
            degree: degree > 0 ? degree : null,
            // Some participants write the name of their organization in quotes.
            organization: statsText(cells.organization).replace(/["„“”]/g, '').trim(),
            city: statsText(cells.city),
        };
    });
    const cities = statsCityNames(participants.map((participant) => participant.city));
    participants.forEach((participant, index) => {
        participant.city = cities[index];
    });
    return participants;
}

function statsText(cell) {
    return cell.textContent.replace(/\s+/g, ' ').trim();
}

// Participants write their city freely: "Praha 5", "praha", "Praha - Vinohrady", "Brno-střed", "Nachod".
// A city with its part counts as the city, when someone wrote the city alone. Spellings which differ only
// in case or diacritics count as one city, named as most participants write it.
function statsCityNames(cities) {
    const withoutPart = (city) => city.split(/\s*[,(]|\s+-\s+|\s*\d/)[0].replace(/-$/, '').trim();
    const keyOf = (name) => name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const knownKeys = new Set(cities.map((city) => keyOf(withoutPart(city))));

    // The shortest beginning of the name (by words or parts joined with a dash) which someone wrote as their whole city.
    // The whole name is one of them, so there always is one.
    const keys = cities.map((city) => {
        const words = withoutPart(city).split(/(?=[\s-])/);
        const length = words.findIndex((_, index) => knownKeys.has(keyOf(words.slice(0, index + 1).join(''))));
        return keyOf(words.slice(0, length + 1).join(''));
    });

    const spellings = new Map();
    cities.forEach((city, index) => {
        const name = withoutPart(city);
        if (keyOf(name) === keys[index]) {
            const counts = spellings.get(keys[index]) ?? new Map();
            counts.set(name, (counts.get(name) ?? 0) + 1);
            spellings.set(keys[index], counts);
        }
    });
    const names = new Map([...spellings].map(([key, counts]) => [key, [...counts].sort((a, b) => b[1] - a[1])[0][0]]));
    return keys.map((key) => names.get(key));
}

function buildStatsTabs(list, stats, count) {
    const tabs = buildElement('div', 'cvvz-stats-tabs');
    tabs.setAttribute('role', 'tablist');
    const listTab = buildStatsTab('Seznam účastníků');
    listTab.append(buildElement('span', 'cvvz-stats-tab-count', String(count)));
    const statsTab = buildStatsTab('Statistiky');
    statsTab.append(buildStatsPlus());
    tabs.append(listTab, statsTab);

    const showTab = () => {
        const showStats = window.location.hash === STATS_HASH;
        listTab.setAttribute('aria-selected', String(!showStats));
        statsTab.setAttribute('aria-selected', String(showStats));
        list.classList.toggle('cvvz-hidden', showStats);
        stats.classList.toggle('cvvz-hidden', !showStats);
    };
    // The open tab is in the URL, so it stays open after reloading, and the site's link opens it also on this page.
    listTab.addEventListener('click', () => {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        showTab();
    });
    statsTab.addEventListener('click', () => {
        window.history.replaceState(null, '', STATS_HASH);
        showTab();
    });
    window.addEventListener('hashchange', showTab);
    showTab();
    return tabs;
}

function buildStatsTab(text) {
    const tab = buildElement('button', 'cvvz-stats-tab', text);
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    return tab;
}

function buildStatsPanel(participants, location) {
    const panel = buildElement('section', 'cvvz-stats');
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-label', 'Statistiky');
    const toolbar = buildElement('div', 'cvvz-stats-toolbar');
    const switcher = buildElement('div', 'cvvz-stats-switch');
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Statistiky pro');
    const modeNote = buildElement('span', 'cvvz-stats-note');
    const cards = buildElement('div', 'cvvz-stats-cards');
    const highestDegree = Math.max(0, ...participants.map((participant) => participant.degree ?? 0));

    const buttons = STATS_MODES.map((mode) => {
        const button = buildElement('button', '', mode.label);
        button.type = 'button';
        button.append(buildElement('span', 'cvvz-stats-switch-count', String(participants.filter(mode.includes).length)));
        button.addEventListener('click', () => showMode(mode));
        return button;
    });
    const showMode = (mode) => {
        buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(STATS_MODES[index] === mode)));
        const shown = participants.filter(mode.includes);
        modeNote.textContent = mode === STATS_MODES[0] ? '' : `Statistiky jen pro ${shown.length} ${mode.noun} z ${participants.length}.`;
        cards.replaceChildren(...buildStatsCards(participants, shown, mode, highestDegree));
    };
    showMode(STATS_MODES[0]);

    switcher.append(...buttons);
    toolbar.append(switcher, modeNote);
    panel.append(toolbar);
    const filterNote = buildStatsFilterNote(location);
    if (filterNote) {
        panel.append(filterNote);
    }
    panel.append(cards);
    return panel;
}

function buildStatsFilterNote(location) {
    const params = new URLSearchParams(location.search);
    const values = ['name', 'city', 'organisation']
        .map((field) => params.get(`event_registration_filter[${field}]`)?.trim())
        .filter(Boolean);
    if (values.length === 0) {
        return null;
    }
    const note = buildElement('p', 'cvvz-stats-filter', `Statistiky jen pro účastníky podle filtru: ${values.join(', ')}. `);
    const link = buildElement('a', '', 'Zobrazit statistiky všech');
    link.href = STATS_URL;
    note.append(link);
    return note;
}

function buildStatsCards(participants, shown, mode, highestDegree) {
    if (shown.length === 0) {
        return [buildElement('p', 'cvvz-stats-note', 'Žádní účastníci.')];
    }
    const organizations = countStatsValues(shown.map((participant) => participant.organization));
    const cities = countStatsValues(shown.map((participant) => participant.city));
    const withoutOrganization = shown.filter((participant) => !participant.organization).length;
    return [
        buildStatsSummary(participants, shown, mode, organizations, cities, withoutOrganization),
        buildStatsPaid(participants, mode),
        buildStatsDegrees(shown, highestDegree),
        buildStatsGroupSizes(organizations, withoutOrganization),
        buildStatsCard(
            'Organizace',
            `${organizations.length} ${statsPlural(organizations.length, STATS_ORGANIZATION_NOUN)}`,
            buildStatsRanking(groupStatsOrganizations(organizations), STATS_ORGANIZATION_NOUN),
            buildElement('p', 'cvvz-stats-note', `Bez organizace: ${statsPeople(withoutOrganization)}`),
        ),
        buildStatsCard('Města', `${cities.length} ${statsPlural(cities.length, STATS_CITY_NOUN)}`, buildStatsRanking(cities, STATS_CITY_NOUN)),
    ];
}

function buildStatsSummary(participants, shown, mode, organizations, cities, withoutOrganization) {
    const summary = buildElement('div', 'cvvz-stats-summary cvvz-stats-wide');
    const shownLabel = mode.noun[0].toUpperCase() + mode.noun.slice(1);
    summary.append(
        buildStatsTile(shownLabel, shown.length, mode === STATS_MODES[0] ? '' : `z ${participants.length} přihlášených`),
        buildStatsTile('Organizací', organizations.length),
        buildStatsTile('Měst', cities.length),
        buildStatsTile('Bez organizace', withoutOrganization, `${statsPercent(withoutOrganization, shown.length)} %`),
    );
    return summary;
}

function buildStatsTile(label, value, note = '') {
    const tile = buildElement('div', 'cvvz-stats-tile');
    tile.append(buildElement('span', 'cvvz-stats-tile-label', label), buildElement('span', 'cvvz-stats-figure', String(value)));
    if (note) {
        tile.append(buildElement('span', 'cvvz-stats-note', note));
    }
    return tile;
}

// Always of all participants: with paid or unpaid shown, their part stands out and the other stays for comparison.
function buildStatsPaid(participants, mode) {
    const paid = participants.filter((participant) => participant.paid).length;
    const bar = buildElement('div', 'cvvz-stats-paid-bar');
    const legend = buildElement('div', 'cvvz-stats-legend');
    const parts = [
        { label: 'Zaplaceno', count: paid, className: 'cvvz-stats-paid', mode: STATS_MODES[1] },
        { label: 'Nezaplaceno', count: participants.length - paid, className: 'cvvz-stats-unpaid', mode: STATS_MODES[2] },
    ];
    for (const part of parts) {
        if (part.count > 0) {
            const segment = buildElement('span', part.className);
            segment.classList.toggle('cvvz-stats-dimmed', mode !== STATS_MODES[0] && mode !== part.mode);
            segment.style.width = `${(part.count / participants.length) * 100}%`;
            bar.append(segment);
        }
        const item = buildElement('span', '', `${part.label} `);
        item.prepend(buildElement('span', `cvvz-stats-swatch ${part.className}`));
        item.append(buildElement('strong', '', String(part.count)), ` · ${statsPercent(part.count, participants.length)} %`);
        legend.append(item);
    }
    const card = buildStatsCard('Zaplaceno', `z ${participants.length} přihlášených`, bar, legend);
    card.classList.add('cvvz-stats-wide');
    return card;
}

function buildStatsDegrees(shown, highestDegree) {
    const withDegree = shown.filter((participant) => participant.degree);
    const participantsNoun = statsPlural(shown.length, ['účastníka', 'účastníků', 'účastníků']);
    const note = `BL má vyplněno ${withDegree.length} z ${shown.length} ${participantsNoun} (${statsPercent(withDegree.length, shown.length)} %)`;
    const card = buildStatsCard('Stupně Březového lístku', note);
    if (highestDegree > 0) {
        card.append(buildStatsDegreeChart(withDegree, highestDegree));
    }
    return card;
}

// A column for each degree up to the highest one of all participants, so the switch keeps the same columns.
function buildStatsDegreeChart(participants, highestDegree) {
    const degrees = Array.from({ length: highestDegree }, (_, index) => index + 1);
    const counts = degrees.map((degree) => participants.filter((participant) => participant.degree === degree).length);
    const max = Math.max(...counts, 1);
    const columns = buildElement('div', 'cvvz-stats-columns');
    const axis = buildElement('div', 'cvvz-stats-axis');
    columns.style.gridTemplateColumns = `repeat(${highestDegree}, 1fr)`;
    axis.style.gridTemplateColumns = columns.style.gridTemplateColumns;
    degrees.forEach((degree, index) => {
        const column = buildElement('span', 'cvvz-stats-column');
        column.title = `${degree}. stupeň: ${statsPeople(counts[index])}`;
        if (counts[index] > 0) {
            const fill = buildElement('span', 'cvvz-stats-column-fill');
            // Leaves room for the count above the highest column.
            fill.style.height = `calc((100% - 20px) * ${counts[index] / max})`;
            column.append(buildElement('span', 'cvvz-stats-column-count', String(counts[index])), fill);
        }
        columns.append(column);
        axis.append(buildElement('span', '', String(degree)));
    });
    const chart = buildElement('div', 'cvvz-stats-degree-chart');
    chart.append(columns, axis, buildElement('div', 'cvvz-stats-axis-title', 'stupeň BL'));
    return chart;
}

function buildStatsGroupSizes(organizations, withoutOrganization) {
    const sizes = STATS_GROUP_SIZES.map((size) => {
        const matching = organizations.filter((organization) => organization.count >= size.min && organization.count <= size.max);
        return { ...size, organizations: matching.length, count: matching.reduce((sum, organization) => sum + organization.count, 0) };
    });
    const max = Math.max(...sizes.map((size) => size.count));
    const list = buildElement('div', 'cvvz-stats-ranking');
    list.append(...sizes.map((size) => buildStatsBar(
        size.name,
        `${size.organizations} ${statsPlural(size.organizations, STATS_ORGANIZATION_NOUN)}`,
        size.count,
        max,
        statsPeople(size.count),
    )));
    return buildStatsCard(
        'Velikost výprav',
        'kolik lidí jede z jedné organizace',
        list,
        buildElement('p', 'cvvz-stats-note', `Bez organizace: ${statsPeople(withoutOrganization)}`),
    );
}

function countStatsValues(values) {
    const counts = new Map();
    for (const value of values.filter(Boolean)) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts].map(([name, count]) => ({ name, count })).sort(compareStatsItems);
}

function compareStatsItems(a, b) {
    return b.count - a.count || a.name.localeCompare(b.name, 'cs');
}

// Units of a big organization become one item with the units listed in it.
function groupStatsOrganizations(organizations) {
    const items = [];
    const groupItems = new Map();
    for (const organization of organizations) {
        const group = STATS_ORGANIZATION_GROUPS.find((candidate) => candidate.pattern.test(organization.name));
        if (!group) {
            items.push(organization);
            continue;
        }
        if (!groupItems.has(group)) {
            groupItems.set(group, { name: group.name, count: 0, unit: group.unit, units: [] });
            items.push(groupItems.get(group));
        }
        const item = groupItems.get(group);
        item.count += organization.count;
        item.units.push({ name: statsUnitName(group, organization.name), count: organization.count });
    }
    return items.sort(compareStatsItems);
}

function statsUnitName(group, name) {
    const unit = (group.prefix ? name.replace(group.prefix, '') : name).replace(STATS_LEGAL_FORM, '').trim();
    return unit || name;
}

function buildStatsRanking(items, noun) {
    const max = items[0]?.count ?? 0;
    const ranking = buildElement('div', 'cvvz-stats-ranking');
    ranking.append(...items.slice(0, STATS_RANKING_LIMIT).map((item) => buildStatsItem(item, max)));
    const others = items.slice(STATS_RANKING_LIMIT);
    if (others.length > 0) {
        const count = others.reduce((sum, item) => sum + item.count, 0);
        const details = buildElement('details', 'cvvz-stats-others');
        const list = buildElement('div', 'cvvz-stats-ranking');
        list.append(...others.map((item) => buildStatsItem(item, max)));
        details.append(
            buildElement('summary', '', `${statsPlural(others.length, ['Další', 'Další', 'Dalších'])} ${others.length} ${statsPlural(others.length, noun)} · ${statsPeople(count)}`),
            list,
        );
        ranking.append(details);
    }
    return ranking;
}

function buildStatsItem(item, max) {
    if (!item.units) {
        return buildStatsBar(item.name, '', item.count, max);
    }
    const group = buildElement('details', 'cvvz-stats-group');
    const summary = buildElement('summary');
    summary.append(buildStatsBar(item.name, `${item.units.length} ${statsPlural(item.units.length, item.unit)}`, item.count, max));
    const units = buildElement('div', 'cvvz-stats-units');
    units.append(...item.units.map((unit) => buildStatsBar(unit.name, '', unit.count, max)));
    group.append(summary, units);
    return group;
}

// Built of spans, so it can be in the summary of a group.
function buildStatsBar(name, note, count, max, value = String(count)) {
    const bar = buildElement('span', 'cvvz-stats-bar');
    const label = buildElement('span', 'cvvz-stats-bar-label');
    const nameElement = buildElement('span', 'cvvz-stats-bar-name', name);
    if (note) {
        nameElement.append(' ', buildElement('small', '', note));
    }
    label.append(nameElement, buildElement('span', 'cvvz-stats-bar-value', value));
    const fill = buildElement('span', 'cvvz-stats-bar-fill');
    fill.style.width = `${max > 0 ? (count / max) * 100 : 0}%`;
    bar.append(label, fill);
    return bar;
}

function buildStatsCard(title, note, ...content) {
    const card = buildElement('section', 'cvvz-stats-card');
    const header = buildElement('div', 'cvvz-stats-card-header');
    header.append(buildElement('h2', '', title), buildElement('span', 'cvvz-stats-note', note));
    card.append(header, ...content);
    return card;
}

function statsPlural(count, [one, few, many]) {
    if (count === 1) {
        return one;
    }
    return count >= 2 && count <= 4 ? few : many;
}

function statsPeople(count) {
    return `${count} ${statsPlural(count, ['člověk', 'lidé', 'lidí'])}`;
}

function statsPercent(part, whole) {
    return Math.round((part / whole) * 100);
}
