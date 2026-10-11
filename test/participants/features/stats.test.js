import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { enhancePage, FEATURE_SCRIPTS, readFixture, textsOf } from '../../helpers.js';

const PAGE = readFixture('participants-2026-10.html');
const URL = 'https://www.cvvz.cz/prihlaseni-ucastnici';
const STATS_URL = `${URL}#statistiky`;
const FEATURE = ['src/participants/features/stats.js'];

// The fixture page with these participants instead of its own, each as [organization, city, degree, paid].
function pageWith(participants) {
    const dom = new JSDOM(PAGE);
    const { document } = dom.window;
    const template = document.querySelector('tbody tr');
    document.querySelector('tbody').replaceChildren(...participants.map(([organization, city, degree = '', paid = 'Ano'], index) => {
        const row = template.cloneNode(true);
        row.cells[0].textContent = String(index + 1);
        row.cells[4].textContent = degree;
        row.cells[5].textContent = organization;
        row.cells[6].textContent = city;
        row.cells[10].textContent = paid;
        return row;
    }));
    return dom.serialize();
}

function card(document, title) {
    return [...document.querySelectorAll('.cvvz-stats-card')].find((card) => card.querySelector('h2').textContent === title);
}

// Bars of a ranking as "name note: value", without the ones listed after a click.
function rankingBars(element) {
    return [...element.querySelectorAll(':scope > .cvvz-stats-ranking > .cvvz-stats-bar, :scope > .cvvz-stats-ranking > details > summary > .cvvz-stats-bar')]
        .map(barText);
}

function barText(bar) {
    return `${bar.querySelector('.cvvz-stats-bar-name').textContent}: ${bar.querySelector('.cvvz-stats-bar-value').textContent}`;
}

function tiles(document) {
    return [...document.querySelectorAll('.cvvz-stats-tile')].map((tile) => textsOf(tile.children).join(' '));
}

function modeButton(document, label) {
    return [...document.querySelectorAll('.cvvz-stats-switch button')].find((button) => button.firstChild.textContent === label);
}

// Links of the menu item "Aktuální ročník" and of the footer column with the participant list, as [text, href, classes].
function siteLinks(document) {
    const linksOf = (list) => [...list.querySelectorAll('a')].map((link) => [link.textContent, link.getAttribute('href'), link.className]);
    const footerList = document.querySelector('footer a[href="/prihlaseni-ucastnici"]').closest('ul');
    return { menu: linksOf(document.querySelector('header .dropdown-menu')).slice(4, 8), footer: linksOf(footerList).slice(0, 2) };
}

test('adds a link to the statistics to the menu and grays out the site\'s link to a "coming soon" page, on every page', () => {
    const { document } = enhancePage(readFixture('homepage-2026-10.html'), { url: 'https://www.cvvz.cz/', features: FEATURE });

    assert.deepEqual(siteLinks(document).menu, [
        ['Stánky', '/stranka/prodejci', 'dropdown-item'],
        ['Přihlášení účastníci', '/prihlaseni-ucastnici', 'dropdown-item'],
        ['Statistiky účastníků', '/prihlaseni-ucastnici#statistiky', 'dropdown-item'],
        ['Statistiky účastníků', '/pripravujeme', 'dropdown-item cvvz-stats-coming-soon'],
    ]);
    assert.ok(document.querySelector('header a[href="/prihlaseni-ucastnici#statistiky"] > .cvvz-plus'));
});

test('replaces the footer link to the statistics', () => {
    const { document } = enhancePage(readFixture('homepage-2026-10.html'), { url: 'https://www.cvvz.cz/', features: FEATURE });

    assert.deepEqual(siteLinks(document).footer, [
        ['Přihlášení účastníci', '/prihlaseni-ucastnici', ''],
        ['Statistiky účastníků', '/prihlaseni-ucastnici#statistiky', ''],
    ]);
    assert.ok(document.querySelector('footer a[href="/prihlaseni-ucastnici#statistiky"] > .cvvz-plus'));
});

test('leaves the site\'s menu link as it is when it leads to statistics of the site, and still replaces the footer link', () => {
    const page = readFixture('homepage-2026-10.html').replaceAll('href="/pripravujeme">Statistiky účastníků', 'href="/statistiky">Statistiky účastníků');
    const { document } = enhancePage(page, { url: 'https://www.cvvz.cz/', features: FEATURE });

    assert.deepEqual(siteLinks(document).menu.slice(2), [
        ['Statistiky účastníků', '/prihlaseni-ucastnici#statistiky', 'dropdown-item'],
        ['Statistiky účastníků', '/statistiky', 'dropdown-item'],
    ]);
    assert.equal(siteLinks(document).footer[1][1], '/prihlaseni-ucastnici#statistiky');
});

test('leaves the menu and the footer as the site shows them when the feature is turned off', () => {
    const page = readFixture('homepage-2026-10.html');
    const { document } = enhancePage(page, { url: 'https://www.cvvz.cz/', features: FEATURE, disabledFeatures: ['participants/stats'] });

    assert.deepEqual(siteLinks(document), siteLinks(new JSDOM(page).window.document));
});

test('adds a tab with the statistics next to the list, with the list open', () => {
    const { document, warnings } = enhancePage(PAGE, { url: URL, features: FEATURE });
    const tabs = document.querySelectorAll('.cvvz-stats-tab');

    assert.deepEqual(warnings, []);
    assert.deepEqual(textsOf(tabs), ['Seznam účastníků9', 'Statistiky']);
    assert.ok(tabs[1].querySelector('.cvvz-plus'));
    assert.deepEqual([...tabs].map((tab) => tab.getAttribute('aria-selected')), ['true', 'false']);
    assert.ok(document.querySelector('.cvvz-stats').classList.contains('cvvz-hidden'));
    assert.equal(document.querySelector('.table-container').closest('.cvvz-hidden'), null);
});

test('opens the statistics from the link', () => {
    const { document } = enhancePage(PAGE, { url: STATS_URL, features: FEATURE });

    assert.equal(document.querySelector('.cvvz-stats-tab[aria-selected="true"]').textContent, 'Statistiky');
    assert.equal(document.querySelector('.cvvz-stats').classList.contains('cvvz-hidden'), false);
    assert.ok(document.querySelector('.table-container').closest('.cvvz-hidden'));
});

test('switches the tabs and keeps the open one in the URL, with the filter', () => {
    const { window, document } = enhancePage(PAGE, { url: `${URL}?event_registration_filter%5Bcity%5D=Brno`, features: FEATURE });
    const [listTab, statsTab] = document.querySelectorAll('.cvvz-stats-tab');

    statsTab.click();
    assert.equal(window.location.search, '?event_registration_filter%5Bcity%5D=Brno');
    assert.equal(window.location.hash, '#statistiky');
    assert.equal(document.querySelector('.cvvz-stats').classList.contains('cvvz-hidden'), false);

    listTab.click();
    assert.equal(window.location.search, '?event_registration_filter%5Bcity%5D=Brno');
    assert.equal(window.location.hash, '');
    assert.ok(document.querySelector('.cvvz-stats').classList.contains('cvvz-hidden'));
});

test('opens the statistics when the site\'s link is clicked on the list', async () => {
    const { window, document } = enhancePage(PAGE, { url: URL, features: FEATURE });

    const changed = new Promise((resolve) => window.addEventListener('hashchange', resolve));
    window.location.hash = 'statistiky';
    await changed;

    assert.equal(document.querySelector('.cvvz-stats').classList.contains('cvvz-hidden'), false);
});

test('counts the participants, their organizations and cities', () => {
    const { document } = enhancePage(PAGE, { url: STATS_URL, features: FEATURE });

    assert.deepEqual(tiles(document), ['Přihlášených 9', 'Organizací 4', 'Měst 7', 'Bez organizace 3 33 %']);
    assert.deepEqual(rankingBars(card(document, 'Organizace')), [
        'Oddíl Pokus, p.s.: 2',
        'Spolek Ukázka, z.s.: 2',
        'Turistický oddíl Příklad: 1',
        'Základní článek Hnutí Ukázka - turistický oddíl s opravdu hodně dlouhým názvem, z.s.: 1',
    ]);
    assert.deepEqual(rankingBars(card(document, 'Města')), [
        'Brno: 2', 'Kolín: 2', 'České Budějovice: 1', 'Jihlava: 1', 'Ostrava: 1', 'Pardubice: 1', 'Praha: 1',
    ]);
});

test('shows how many participants paid', () => {
    const { document } = enhancePage(PAGE, { url: STATS_URL, features: FEATURE });
    const paid = card(document, 'Zaplaceno');

    assert.deepEqual(textsOf(paid.querySelector('.cvvz-stats-legend').children), ['Zaplaceno 6 · 67 %', 'Nezaplaceno 3 · 33 %']);
    assert.deepEqual([...paid.querySelector('.cvvz-stats-paid-bar').children].map((segment) => segment.style.width), ['66.66666666666666%', '33.33333333333333%']);
});

test('shows a column for each degree up to the highest one, and how many participants filled in their degree', () => {
    const { document } = enhancePage(PAGE, { url: STATS_URL, features: FEATURE });
    const degrees = card(document, 'Stupně Březového lístku');

    assert.equal(degrees.querySelector('.cvvz-stats-card-header .cvvz-stats-note').textContent, 'BL má vyplněno 5 z 9 účastníků (56 %)');
    assert.deepEqual(textsOf(degrees.querySelectorAll('.cvvz-stats-axis span')), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    assert.deepEqual([...degrees.querySelectorAll('.cvvz-stats-column')].filter((column) => column.children.length).map((column) => column.title), [
        '1. stupeň: 1 člověk', '2. stupeň: 1 člověk', '3. stupeň: 1 člověk', '7. stupeň: 1 člověk', '12. stupeň: 1 člověk',
    ]);
});

test('shows the statistics of only paid or unpaid participants', () => {
    const { document } = enhancePage(PAGE, { url: STATS_URL, features: FEATURE });

    modeButton(document, 'Nezaplacení').click();

    assert.deepEqual([...document.querySelectorAll('.cvvz-stats-switch button')].map((button) => button.getAttribute('aria-pressed')), ['false', 'false', 'true']);
    assert.equal(document.querySelector('.cvvz-stats-toolbar .cvvz-stats-note').textContent, 'Statistiky jen pro 3 nezaplacených z 9.');
    assert.deepEqual(tiles(document), ['Nezaplacených 3 z 9 přihlášených', 'Organizací 2', 'Měst 3', 'Bez organizace 1 33 %']);
    assert.deepEqual([...document.querySelectorAll('.cvvz-stats-paid-bar > span')].map((segment) => segment.classList.contains('cvvz-stats-dimmed')), [true, false]);
    assert.equal(document.querySelectorAll('.cvvz-stats-axis span').length, 12);

    modeButton(document, 'Všichni').click();
    assert.deepEqual(tiles(document)[0], 'Přihlášených 9');
});

test('shows how many participants come in groups of which size', () => {
    const { document } = enhancePage(PAGE, { url: STATS_URL, features: FEATURE });

    assert.deepEqual(rankingBars(card(document, 'Velikost výprav')), [
        '1 člověk 2 organizace: 2 lidé', '2–4 lidé 2 organizace: 4 lidé', '5–9 lidí 0 organizací: 0 lidí', '10 a více 0 organizací: 0 lidí',
    ]);
});

test('counts units of a big organization together, with the units listed after a click', () => {
    const { document } = enhancePage(pageWith([
        ['Pionýr, z. s. - Pionýrská skupina Hraničář', 'Brno'],
        ['Pionýr, z. s. - Pionýrská skupina Hraničář', 'Brno'],
        ['Pionýr, z.s. - 73. pionýrská skupina Vodovod', 'Brno'],
        ['Základní článek Hnutí Brontosaurus BRĎO Vlkani', 'Brno'],
        ['Junák - český skaut, středisko Kalich Tábor, z. s.', 'Tábor'],
        ['Duhové prázdniny, z.s.', 'Brno'],
    ]), { url: STATS_URL, features: FEATURE });
    const organizations = card(document, 'Organizace');

    assert.deepEqual(rankingBars(organizations), [
        'Pionýr 2 skupiny: 3',
        'Duhové prázdniny, z.s.: 1',
        'Hnutí Brontosaurus 1 článek: 1',
        'Junák – český skaut 1 středisko: 1',
    ]);
    assert.deepEqual([...organizations.querySelector('.cvvz-stats-units').children].map(barText), [
        'Pionýrská skupina Hraničář: 2',
        '73. pionýrská skupina Vodovod: 1',
    ]);
    assert.equal(organizations.querySelector('.cvvz-stats-card-header .cvvz-stats-note').textContent, '5 organizací');
});

test('lists the other organizations after a click', () => {
    const participants = Array.from({ length: 12 }, (_, index) => [`Oddíl ${String(index + 1).padStart(2, '0')}`, 'Brno']);
    const { document } = enhancePage(pageWith(participants), { url: STATS_URL, features: FEATURE });
    const others = card(document, 'Organizace').querySelector('.cvvz-stats-others');

    assert.equal(rankingBars(card(document, 'Organizace')).length, 10);
    assert.equal(others.querySelector('summary').textContent, 'Další 2 organizace · 2 lidé');
    assert.deepEqual([...others.querySelectorAll('.cvvz-stats-bar')].map(barText), ['Oddíl 11: 1', 'Oddíl 12: 1']);
});

test('counts parts and different spellings of a city as one city', () => {
    const cities = ['Praha', 'Praha 5', 'praha', 'Praha - Vinohrady', 'Brno', 'Brno-střed', 'Nachod', 'Náchod', 'Náchod', 'Frýdek-Místek', 'Ostrava (okr. Ostrava-město)'];
    const { document } = enhancePage(pageWith(cities.map((city) => ['', city])), { url: STATS_URL, features: FEATURE });

    assert.deepEqual(rankingBars(card(document, 'Města')), ['Praha: 4', 'Náchod: 3', 'Brno: 2', 'Frýdek-Místek: 1', 'Ostrava: 1']);
});

test('tells that the statistics are of the participants found by the filter', () => {
    const { document } = enhancePage(PAGE, { url: `${URL}?event_registration_filter%5Bname%5D=&event_registration_filter%5Bcity%5D=Brno#statistiky`, features: FEATURE });
    const note = document.querySelector('.cvvz-stats-filter');

    assert.equal(note.textContent, 'Statistiky jen pro účastníky podle filtru: Brno. Zobrazit statistiky všech');
    assert.equal(note.querySelector('a').getAttribute('href'), '/prihlaseni-ucastnici#statistiky');
});

test('works with a filter that found no participants', () => {
    const { document, warnings } = enhancePage(PAGE.replace(/<tbody>[\s\S]*<\/tbody>/, '<tbody></tbody>'), { url: STATS_URL, features: FEATURE });

    assert.deepEqual(warnings, []);
    assert.equal(document.querySelector('.cvvz-stats-cards').textContent, 'Žádní účastníci.');
});

test('works together with the other participant features, which change the table after it', () => {
    const features = FEATURE_SCRIPTS.filter((script) => script.startsWith('src/participants/'));
    const { document, warnings } = enhancePage(PAGE, { url: STATS_URL, features });

    assert.equal(features[0], FEATURE[0]);
    assert.deepEqual(warnings, []);
    assert.ok(document.querySelector('.cvvz-compact-table .cvvz-contacts'));
    assert.deepEqual(textsOf(card(document, 'Zaplaceno').querySelector('.cvvz-stats-legend').children), ['Zaplaceno 6 · 67 %', 'Nezaplaceno 3 · 33 %']);
});

test('leaves the page as the site shows it when it does not understand the paid column', () => {
    const { document, warnings } = enhancePage(PAGE.replace('<td>Ano</td>', '<td>Možná</td>'), { url: STATS_URL, features: FEATURE });

    assert.equal(document.querySelector('.cvvz-stats, .cvvz-stats-tabs, .cvvz-hidden'), null);
    assert.equal(warnings[0][1][0].reason, 'unexpected paid value: Možná');
});
