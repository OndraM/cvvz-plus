import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { enhancePage, readFixture, textsOf } from '../../helpers.js';

const PAGE = readFixture('moje-programy-2026-10.html');
const URL = 'https://www.cvvz.cz/moje-programy';
const FEATURE = ['src/my-programs/features/timeline.js'];
const TAB_KEY = 'cvvz-plus-my-programs-tab';

// Runs the timeline on the page at the given time, by default long before the event.
// jsdom does not scroll, so scrolling is recorded, and so is the timer moving the current time, to call it in the test.
function openPage(html = PAGE, { now = '2026-10-01T12:00', tab = null } = {}) {
    const scrolls = [];
    const timers = [];
    let setNow;
    const page = enhancePage(html, {
        url: URL,
        features: FEATURE,
        beforeEnhance: (window) => {
            const RealDate = window.Date;
            let current = new RealDate(now).getTime();
            setNow = (time) => {
                current = new RealDate(time).getTime();
            };
            window.Date = class extends RealDate {
                constructor(...args) {
                    super(...(args.length > 0 ? args : [current]));
                }
            };
            window.setInterval = (callback, delay) => timers.push({ callback, delay });
            window.Element.prototype.scrollIntoView = function (options) {
                scrolls.push({ element: this, options });
            };
            if (tab) {
                window.localStorage.setItem(TAB_KEY, tab);
            }
        },
    });
    return { ...page, scrolls, timers, setNow };
}

// The fixture page with these rows instead of its own, each as [date, weekday, from, to, title];
// a row without a title is a free block.
function pageWith(rows) {
    const dom = new JSDOM(PAGE);
    const { document } = dom.window;
    const body = document.querySelector('tbody');
    const [freeRow, programRow] = body.rows;
    body.replaceChildren(...rows.map(([date, weekday, from, to, title]) => {
        const row = (title ? programRow : freeRow).cloneNode(true);
        row.cells[0].innerHTML = `${date}<br>${weekday}`;
        row.cells[1].textContent = `${from}\u2014${to}`;
        if (title) {
            row.cells[2].querySelector('a').textContent = title;
        }
        return row;
    }));
    return dom.serialize();
}

function tabs(document) {
    return document.querySelectorAll('.cvvz-tab');
}

function isHidden(element) {
    return element.classList.contains('cvvz-hidden');
}

// Blocks of each day as "time text", the text being the program's title or the free block's texts.
function daysOf(document) {
    return Object.fromEntries([...document.querySelectorAll('.cvvz-timeline-day')].map((day) => [
        day.querySelector('.cvvz-timeline-day-name').textContent,
        [...day.querySelectorAll('.cvvz-timeline-block')].map((block) => {
            const title = block.querySelector('.cvvz-timeline-title');
            const [time, ...texts] = [...block.children].map((child) => child.textContent);
            return `${time} ${title ? title.textContent : texts.map((text) => text.trim()).filter(Boolean).join(' ')}`;
        }),
    ]));
}

function blockOf(document, title) {
    return [...document.querySelectorAll('.cvvz-timeline-block')].find((block) => block.querySelector('.cvvz-timeline-title')?.textContent === title);
}

function blockAt(document, time) {
    return [...document.querySelectorAll('.cvvz-timeline-block')].find((block) => block.querySelector('.cvvz-timeline-time').textContent === time);
}

function placement(element) {
    return ['--timeline-columns', '--timeline-rows', '--timeline-lane'].map((name) => element.style.getPropertyValue(name));
}

test('adds a tab with the timeline next to the list, with the list open', () => {
    const { document, warnings } = openPage();

    assert.deepEqual(warnings, []);
    assert.deepEqual(textsOf(tabs(document)), ['Jako seznam', 'Jako časová osa']);
    assert.ok(tabs(document)[1].querySelector('.cvvz-plus'));
    assert.deepEqual([...tabs(document)].map((tab) => tab.getAttribute('aria-selected')), ['true', 'false']);
    assert.ok(isHidden(document.querySelector('.cvvz-timeline')));
    assert.equal(isHidden(document.querySelector('.table-container')), false);
});

test('shows the registered and watched programs and the free blocks in the days of the table', () => {
    const { document } = openPage();

    assert.deepEqual(daysOf(document), {
        'Pátek13. 11.': ['18:00\u201319:30 Volný blok Přihlásit se', '20:00\u201321:30 Ukázkový program', '22:00\u201323:30 Ukázkový hlídaný program v pátek'],
        'Sobota14. 11.': [
            '8:00\u20139:30 Volný blok Přihlásit se',
            '10:00\u201311:30 Volný blok Přihlásit se',
            '14:00\u201315:30 Ukázkový program s opravdu hodně dlouhým názvem, který se nevejde na jeden řádek',
            '16:00\u201317:30 Ukázková dílna',
            '20:00\u201321:30 Ukázkové zakončení',
            '22:00\u201323:30 Ukázková beseda',
        ],
        'Neděle15. 11.': ['8:30\u201310:00 Ukázkový hlídaný program v neděli', '10:30\u201312:00 Volný blok Přihlásit se'],
    });
    assert.equal(blockAt(document, '18:00\u201319:30').querySelector('a').getAttribute('href'), '/program?timeBlock=163');
});

test('shows the details of a registered program, with a copy of the site\'s form to unregister', () => {
    const { document } = openPage();
    const block = blockOf(document, 'Ukázkový program s opravdu hodně dlouhým názvem, který se nevejde na jeden řádek');

    assert.equal(block.querySelector('.cvvz-timeline-title').getAttribute('href'), '/program#program-103');
    assert.deepEqual(textsOf(block.querySelector('.cvvz-timeline-details').children), ['8 z 30 přihlášených', 'Doplatek']);
    assert.equal(block.querySelector('.cvvz-timeline-place, .cvvz-timeline-rating'), null);

    const form = block.querySelector('form.cvvz-timeline-unregister');
    assert.equal(form.getAttribute('action'), '/unregister-program-timeblock');
    assert.equal(form.querySelector('input[name="id"]').value, '1003');
    assert.equal(form.querySelector('button').title, 'Odhlásit se');
    assert.ok(document.querySelector('.table-container input[name="id"][value="1003"]'));
});

test('a program without a surcharge and with one watching for a free place', () => {
    const { document } = openPage(PAGE.replace('>101/1000/0<', '>101/1000/1<'));

    assert.deepEqual(textsOf(blockOf(document, 'Ukázkový program').querySelector('.cvvz-timeline-details').children), ['101 z 1000 přihlášených · 1 hlídá volné místo']);
});

test('shows the place and the rating as the site fills them in', () => {
    const programRow = PAGE.indexOf('/program#program-101');
    const filled = PAGE.slice(0, programRow) + PAGE.slice(programRow)
        .replace('<div></div>', '<div>Učebna 12</div>')
        .replace(/(<td>\s*<\/td>)/, '<td><a href="/hodnoceni/1">Ohodnotit</a></td>');
    const { document } = openPage(filled);
    const block = blockOf(document, 'Ukázkový program');

    assert.equal(block.querySelector('.cvvz-timeline-place').textContent.trim(), 'Učebna 12');
    assert.equal(block.querySelector('.cvvz-timeline-rating a').getAttribute('href'), '/hodnoceni/1');
});

test('shows a watched program of the table in its time block, with its details and a copy of the form to stop watching', () => {
    const { document, warnings } = openPage();
    const block = blockOf(document, 'Ukázkový hlídaný program v pátek');

    assert.deepEqual(warnings, []);
    assert.deepEqual([...block.classList], ['cvvz-timeline-block', 'cvvz-timeline-watched']);
    assert.equal(block.querySelector('.cvvz-timeline-watched-title').textContent, 'Hlídací pes: Ukázkový hlídaný program v pátek');
    assert.equal(block.querySelector('.cvvz-timeline-title').getAttribute('href'), '/program#program-102');
    assert.deepEqual(textsOf(block.querySelector('.cvvz-timeline-details').children), ['20 z 20 přihlášených · 10 hlídá volné místo']);
    assert.equal(block.querySelector('form input[name="id"]').value, '1002');
    assert.equal(block.querySelector('form button').title, 'Zrušit hlídání');
});

// The site's window lists also the watched programs of the past years, even at the times of this year's blocks,
// while the table has only the blocks of this year.
test('shows the watched programs of the table only, not those only in the site\'s window', () => {
    const { document } = openPage(PAGE.replace('neděle 10:00 až 11:30', 'sobota 14:00 až 15:30'));

    assert.ok(document.getElementById('watchdogModal').textContent.includes('Ukázkový loňský hlídaný program'));
    assert.equal(document.querySelector('.cvvz-timeline').textContent.includes('Ukázkový loňský hlídaný program'), false);
});

test('shows the place of a watched program as the site fills it in', () => {
    const row = PAGE.indexOf('/program#program-102');
    const filled = PAGE.slice(0, row) + PAGE.slice(row).replace('<div></div>', '<div>Učebna 12</div>');
    const { document } = openPage(filled);

    assert.equal(blockOf(document, 'Ukázkový hlídaný program v pátek').querySelector('.cvvz-timeline-place').textContent.trim(), 'Učebna 12');
});

test('places the blocks on the shared time axis of the wide screen and in their own day on a phone', () => {
    const { document } = openPage();

    // The axis is from 8:00 to 24:00 in 5-minute slots, Friday is from 18:00.
    assert.equal(document.querySelector('.cvvz-timeline-days').style.getPropertyValue('--timeline-slots'), '192');
    assert.equal(document.querySelector('.cvvz-timeline-track').style.getPropertyValue('--timeline-day-slots'), '72');
    assert.deepEqual(placement(blockOf(document, 'Ukázkový program')), ['145 / 163', '25 / 43', '1 / 2']);
    assert.deepEqual(textsOf(document.querySelectorAll('.cvvz-timeline-hours-track span')).slice(0, 2), ['8:00', '9:00']);
    assert.deepEqual(textsOf(document.querySelector('.cvvz-timeline-day').querySelectorAll('.cvvz-timeline-hour')), ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00']);
});

test('puts a free block at the time of a registered program aside, and free blocks at the same time next to each other', () => {
    const { document, warnings } = openPage(pageWith([
        ['14. 11. 2026', 'sobota', '10:00', '11:30'],
        ['14. 11. 2026', 'sobota', '10:00', '12:00'],
        ['14. 11. 2026', 'sobota', '13:00', '17:30', 'Workshop'],
        ['14. 11. 2026', 'sobota', '14:00', '15:30'],
        ['14. 11. 2026', 'sobota', '16:00', '17:30'],
        ['14. 11. 2026', 'sobota', '18:00', '19:00'],
    ]));
    const asides = document.querySelectorAll('.cvvz-timeline-aside');

    assert.deepEqual(warnings, []);
    assert.equal(document.querySelector('.cvvz-timeline-track').style.getPropertyValue('--timeline-lanes'), '2');
    assert.deepEqual(textsOf(asides), ['14:00\u201315:30Přihlásit se', '16:00\u201317:30Přihlásit se']);
    assert.deepEqual(placement(asides[0])[2], '3 / 4');
    assert.deepEqual(placement(blockOf(document, 'Workshop'))[2], '1 / 3');
    assert.deepEqual(placement(blockAt(document, '10:00\u201311:30'))[2], '1 / 2');
    assert.deepEqual(placement(blockAt(document, '10:00\u201312:00'))[2], '2 / 4');
    assert.deepEqual(placement(blockAt(document, '18:00\u201319:00'))[2], '1 / 4');
});

test('a block past midnight ends in its day', () => {
    const { document } = openPage(pageWith([
        ['14. 11. 2026', 'sobota', '22:00', '23:30'],
        ['14. 11. 2026', 'sobota', '23:30', '01:00', 'Noční hra'],
    ]));

    assert.equal(blockOf(document, 'Noční hra').querySelector('.cvvz-timeline-time').textContent, '23:30\u20131:00');
    assert.equal(document.querySelector('.cvvz-timeline-track').style.getPropertyValue('--timeline-day-slots'), '36');
});

test('shows a block of the night after midnight at the end of the evening before', () => {
    const { document } = openPage(pageWith([
        ['13. 11. 2026', 'pátek', '22:00', '23:30'],
        ['14. 11. 2026', 'sobota', '00:00', '01:30', 'Noční hra'],
        ['14. 11. 2026', 'sobota', '08:00', '09:30'],
    ]));
    const friday = document.querySelector('.cvvz-timeline-day[data-date="2026-11-13"]');

    assert.deepEqual(daysOf(document), {
        'Pátek13. 11.': ['22:00\u201323:30 Volný blok Přihlásit se', '0:00\u20131:30 Noční hra'],
        'Sobota14. 11.': ['8:00\u20139:30 Volný blok Přihlásit se'],
    });
    // Friday is from 22:00 to 2:00, the axis of all days from 8:00.
    assert.equal(friday.querySelector('.cvvz-timeline-track').style.getPropertyValue('--timeline-day-slots'), '48');
    assert.deepEqual(placement(blockOf(document, 'Noční hra')).slice(0, 2), ['193 / 211', '25 / 43']);
});

test('keeps a block of the night in its own day when the table has no evening before', () => {
    const { document } = openPage(pageWith([['14. 11. 2026', 'sobota', '00:00', '01:30', 'Noční hra']]));

    assert.deepEqual(daysOf(document), { 'Sobota14. 11.': ['0:00\u20131:30 Noční hra'] });
});

test('leaves the page as the site shows it when the browser keeps no data of the site', () => {
    const { document } = enhancePage(PAGE, {
        url: URL,
        features: FEATURE,
        beforeEnhance: (window) => Object.defineProperty(window, 'localStorage', { value: null }),
    });

    assert.equal(document.querySelector('.cvvz-tabs, .cvvz-timeline'), null);
    assert.equal(isHidden(document.querySelector('.table-container')), false);
});

test('remembers the open tab and opens it next time', () => {
    const first = openPage();
    tabs(first.document)[1].click();
    assert.equal(first.window.localStorage.getItem(TAB_KEY), 'timeline');
    assert.equal(isHidden(first.document.querySelector('.cvvz-timeline')), false);
    assert.ok(isHidden(first.document.querySelector('.table-container')));

    const next = openPage(PAGE, { tab: 'timeline' });
    assert.equal(next.document.querySelector('.cvvz-tab[aria-selected="true"]').textContent, 'Jako časová osa');
    tabs(next.document)[0].click();
    assert.equal(next.window.localStorage.getItem(TAB_KEY), 'list');
    assert.ok(isHidden(next.document.querySelector('.cvvz-timeline')));
});

test('during the event, shows the current time and scrolls to it when the timeline opens', () => {
    const { document, scrolls } = openPage(PAGE, { now: '2026-11-14T14:42', tab: 'timeline' });
    const line = document.querySelector('.cvvz-timeline-now');

    assert.equal(line.closest('.cvvz-timeline-day').dataset.date, '2026-11-14');
    assert.equal(line.textContent, '14:42');
    assert.deepEqual(placement(line).slice(0, 2), ['81 / span 1', '81 / span 1']);
    assert.equal(line.style.getPropertyValue('--timeline-slot-part'), '0.4');
    assert.equal(scrolls.length, 1);
    assert.equal(scrolls[0].element, line);
    assert.deepEqual({ ...scrolls[0].options }, { block: 'start', inline: 'start' });
});

test('scrolls to the current time when the timeline tab is clicked, not the list tab', () => {
    const { document, scrolls } = openPage(PAGE, { now: '2026-11-13T20:15' });

    tabs(document)[0].click();
    assert.deepEqual(scrolls, []);
    tabs(document)[1].click();
    assert.equal(scrolls.length, 1);
});

test('moves the current time each minute, also to the next day', () => {
    const { document, timers, setNow } = openPage(PAGE, { now: '2026-11-14T23:58' });
    assert.deepEqual(timers.map((timer) => timer.delay), [60000]);
    assert.equal(document.querySelector('.cvvz-timeline-now').textContent, '23:58');

    setNow('2026-11-15T00:30');
    timers[0].callback();
    assert.equal(document.querySelector('.cvvz-timeline-now'), null);

    setNow('2026-11-15T09:05');
    timers[0].callback();
    assert.equal(document.querySelectorAll('.cvvz-timeline-now').length, 1);
    assert.equal(document.querySelector('.cvvz-timeline-now').closest('.cvvz-timeline-day').dataset.date, '2026-11-15');
});

test('after midnight, shows the current time in the night of the evening before', () => {
    const { document } = openPage(pageWith([
        ['13. 11. 2026', 'pátek', '22:00', '23:30'],
        ['14. 11. 2026', 'sobota', '00:00', '01:30'],
        ['14. 11. 2026', 'sobota', '08:00', '09:30'],
    ]), { now: '2026-11-14T00:40' });
    const line = document.querySelector('.cvvz-timeline-now');

    assert.equal(line.closest('.cvvz-timeline-day').dataset.date, '2026-11-13');
    assert.equal(line.textContent, '0:40');
    assert.deepEqual(placement(line).slice(0, 2), ['201 / span 1', '33 / span 1']);
});

test('before the event, shows no current time and does not scroll', () => {
    const { document, scrolls, timers } = openPage(PAGE, { tab: 'timeline' });

    assert.equal(document.querySelector('.cvvz-timeline-now'), null);
    assert.deepEqual(scrolls, []);
    assert.deepEqual(timers, []);
});

test('leaves the page as the site shows it when it does not understand the table', () => {
    for (const [page, reason] of [
        [PAGE.replace('<th>Místo</th>', '<th>Kde</th>'), 'unexpected columns: Den, Čas, Program, Přihlášení, Kde, Hodnocení, Doplatek, '],
        [PAGE.replace('<td>18:00\u201419:30</td>', '<td>večer</td>'), 'unexpected time "večer"'],
        [PAGE.replace('>101/1000/0<', '>101 z 1000<'), 'unexpected counts "101 z 1000"'],
    ]) {
        const { document, warnings } = openPage(page);

        assert.equal(document.querySelector('.cvvz-timeline, .cvvz-tabs, .cvvz-hidden'), null);
        assert.deepEqual(structuredClone(warnings[0][1]), [{ id: 'my-programs/timeline', reason }]);
    }
});
