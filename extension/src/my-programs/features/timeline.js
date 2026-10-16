// The registered programs and free blocks on a timeline, in a tab next to the site's list.
// The tab open last is kept in the site's localStorage, so the page opens with the same view again.
//
// The timeline is a grid of 5-minute slots, laid out by timeline.css: on a wide screen each day is a row
// with time running to the right, all days on one time axis; on a phone the days are one below another,
// time running down, each day from its own first to its last hour.

const TIMELINE_TAB_KEY = 'cvvz-plus-my-programs-tab';
const TIMELINE_SLOT = 5;

registerFeature({
    page: 'my-programs',
    name: 'timeline',
    label: 'Přidat zobrazení přihlášených programů na časové ose',

    enhancePage(document) {
        const table = findScheduleTable(document);
        const days = timelineDays(readSchedule(table));
        const openTimeline = window.localStorage.getItem(TIMELINE_TAB_KEY) === 'timeline';
        const list = table.closest('.table-container');
        const timeline = buildTimeline(days);

        const tabs = buildTabs([
            { content: ['Jako seznam'], panel: list },
            { content: ['Jako časová osa', buildPlusBadge()], panel: timeline },
        ], (index) => {
            window.localStorage.setItem(TIMELINE_TAB_KEY, index === 1 ? 'timeline' : 'list');
            if (index === 1) {
                scrollTimelineToNow(timeline);
            }
        });
        list.before(tabs.row, timeline);

        placeTimelineNow(timeline, days);
        if (days.some((day) => day.date === scheduleDateKey(new Date()))) {
            window.setInterval(() => placeTimelineNow(timeline, days), 60 * 1000);
        }
        if (openTimeline) {
            tabs.selectTab(1);
            scrollTimelineToNow(timeline);
        } else {
            tabs.selectTab(0);
        }
    },
});

// The rows of the schedule grouped into days, each from its first to its last whole hour.
function timelineDays(entries) {
    if (entries.length === 0) {
        throw new Error('no time blocks');
    }
    const days = new Map();
    for (const entry of [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)) {
        if (!days.has(entry.date)) {
            days.set(entry.date, { date: entry.date, day: entry.day, weekday: entry.weekday, blocks: [] });
        }
        days.get(entry.date).blocks.push(entry);
    }
    return [...days.values()].map((day) => ({
        ...day,
        from: Math.floor(Math.min(...day.blocks.map((block) => block.start)) / 60) * 60,
        to: Math.ceil(Math.max(...day.blocks.map((block) => block.end)) / 60) * 60,
        lanes: timelineLanes(day.blocks),
    }));
}

// Lanes of blocks at the same time, side by side as in a calendar; registered programs are never at the same time.
// A free block at the time of a registered program is "aside", in a narrow lane of its own after the others,
// as it can't be registered without leaving the program. Sets `lane` and `laneEnd` (lane lines from 1) of each
// block, which spans all lanes up to the next block at its time. Returns the number of lanes besides the aside one.
function timelineLanes(blocks) {
    const overlap = (a, b) => a !== b && a.start < b.end && b.start < a.end;
    const programs = blocks.filter((block) => block.program && !block.watched);
    const laned = [];
    for (const block of blocks) {
        block.aside = !block.program && programs.some((program) => overlap(block, program));
        if (!block.aside) {
            block.lane = 1;
            while (laned.some((other) => other.lane === block.lane && overlap(block, other))) {
                block.lane++;
            }
            laned.push(block);
        }
    }
    const lanes = Math.max(...laned.map((block) => block.lane), 1);
    const hasAside = blocks.some((block) => block.aside);
    for (const block of blocks.filter((block) => block.aside)) {
        block.lane = lanes + 1;
    }
    for (const block of blocks) {
        const next = blocks.filter((other) => overlap(block, other) && other.lane > block.lane).map((other) => other.lane);
        block.laneEnd = Math.min(...next, lanes + (hasAside ? 2 : 1));
    }
    return lanes;
}

function buildTimeline(days) {
    const timeline = buildElement('section', 'cvvz-timeline');
    timeline.setAttribute('role', 'tabpanel');
    timeline.setAttribute('aria-label', 'Časová osa');
    // Czech, so the browser hyphenates the long words of program titles in narrow blocks.
    timeline.lang = 'cs';

    const from = timelineAxisFrom(days);
    const to = Math.max(...days.map((day) => day.to));
    const rows = buildElement('div', 'cvvz-timeline-days');
    rows.style.setProperty('--timeline-slots', String((to - from) / TIMELINE_SLOT));
    rows.append(buildTimelineHours(from, to));
    for (const day of days) {
        rows.append(buildTimelineDay(day, from));
    }

    const scroller = buildElement('div', 'cvvz-timeline-scroller');
    scroller.append(rows);
    timeline.append(scroller);
    return timeline;
}

// The time axis above the days, on a wide screen.
function buildTimelineHours(from, to) {
    const hours = buildElement('div', 'cvvz-timeline-hours');
    const track = buildElement('div', 'cvvz-timeline-hours-track');
    for (let hour = from; hour < to; hour += 60) {
        const label = buildElement('span', '', timelineTime(hour));
        label.style.setProperty('--timeline-columns', `${timelineSlot(hour, from)} / span 1`);
        track.append(label);
    }
    hours.append(buildElement('span', 'cvvz-timeline-day-name'), track);
    return hours;
}

function buildTimelineDay(day, from) {
    const element = buildElement('div', 'cvvz-timeline-day');
    element.dataset.date = day.date;
    const name = buildElement('div', 'cvvz-timeline-day-name', day.weekday[0].toUpperCase() + day.weekday.slice(1));
    name.append(buildElement('small', '', day.day));

    const track = buildElement('div', 'cvvz-timeline-track');
    track.style.setProperty('--timeline-day-slots', String((day.to - day.from) / TIMELINE_SLOT));
    track.style.setProperty('--timeline-lanes', String(day.lanes));
    // The hours of the day, on a phone.
    for (let hour = day.from; hour < day.to; hour += 60) {
        const line = buildElement('span', 'cvvz-timeline-hour');
        line.append(buildElement('span', '', timelineTime(hour)));
        line.style.setProperty('--timeline-rows', `${timelineSlot(hour, day.from)} / span ${60 / TIMELINE_SLOT}`);
        track.append(line);
    }
    for (const block of day.blocks) {
        const blockElement = buildTimelineBlock(block);
        blockElement.style.setProperty('--timeline-columns', `${timelineSlot(block.start, from)} / ${timelineSlot(block.end, from)}`);
        blockElement.style.setProperty('--timeline-rows', `${timelineSlot(block.start, day.from)} / ${timelineSlot(block.end, day.from)}`);
        blockElement.style.setProperty('--timeline-lane', `${block.lane} / ${block.laneEnd}`);
        track.append(blockElement);
    }
    element.append(name, track);
    return element;
}

function buildTimelineBlock(block) {
    const time = buildElement('span', 'cvvz-timeline-time', `${timelineTime(block.start)}–${timelineTime(block.end)}`);
    if (!block.program) {
        const element = buildElement('div', `cvvz-timeline-block cvvz-timeline-free${block.aside ? ' cvvz-timeline-aside' : ''}`);
        const link = buildElement('a', '', 'Přihlásit se');
        link.href = block.registerUrl;
        element.append(time);
        if (!block.aside) {
            element.append(buildElement('span', '', 'Volný blok'));
        }
        element.append(link);
        return element;
    }

    const element = buildElement('div', `cvvz-timeline-block ${block.watched ? 'cvvz-timeline-watched' : 'cvvz-timeline-program'}`);
    const title = buildElement('a', 'cvvz-timeline-title', block.program.title);
    title.href = block.program.url;
    if (block.watched) {
        const watchedTitle = buildElement('span', 'cvvz-timeline-watched-title');
        watchedTitle.append(buildElement('strong', '', 'Hlídací pes:'), ' ', title);
        element.append(time, watchedTitle);
    } else {
        element.append(time, title);
    }
    if (block.place) {
        const place = buildElement('span', 'cvvz-timeline-place');
        place.append(...timelineCopy(block.place));
        element.append(place);
    }
    const details = buildElement('span', 'cvvz-timeline-details');
    details.append(buildElement('span', 'cvvz-timeline-counts', timelineCounts(block.counts)));
    if (block.surcharge) {
        details.append(buildElement('span', 'cvvz-timeline-surcharge', 'Doplatek'));
    }
    element.append(details);
    if (block.rating) {
        const rating = buildElement('span', 'cvvz-timeline-rating');
        rating.append(...timelineCopy(block.rating));
        element.append(rating);
    }
    element.append(timelineFormCopy(block.unregisterForm, block.watched ? 'Zrušit hlídání' : 'Odhlásit se'));
    return element;
}

// A copy, as the list keeps the site's form. It is a plain form, which works without the site's scripts.
function timelineFormCopy(form, title) {
    const copy = form.cloneNode(true);
    copy.classList.add('cvvz-timeline-unregister');
    copy.querySelector('button').title = title;
    return copy;
}

function timelineCopy(cell) {
    return [...cell.childNodes].map((node) => node.cloneNode(true));
}

// "18 z 25 přihlášených · 2 hlídají volné místo"
function timelineCounts({ registered, capacity, watching }) {
    const watchers = watching > 0 ? ` · ${watching} ${watching >= 2 && watching <= 4 ? 'hlídají' : 'hlídá'} volné místo` : '';
    return `${registered} z ${capacity} přihlášených${watchers}`;
}

// A red line at the current time in its day, when it is a time of the timeline.
function placeTimelineNow(timeline, days) {
    timeline.querySelector('.cvvz-timeline-now')?.remove();
    const findDay = (date, minute) => days.find((day) => day.date === date && minute >= day.from && minute < day.to);
    const now = new Date();
    const today = scheduleDateKey(now);
    let minute = now.getHours() * 60 + now.getMinutes();
    let day = findDay(today, minute);
    // After midnight, it may still be the night of the evening before, after its 24:00.
    if (!day) {
        minute += 24 * 60;
        day = findDay(schedulePreviousDate(today), minute);
    }
    if (!day) {
        return;
    }
    const track = timeline.querySelector(`.cvvz-timeline-day[data-date="${day.date}"] .cvvz-timeline-track`);
    const line = buildElement('div', 'cvvz-timeline-now');
    line.append(buildElement('span', '', timelineTime(minute)));
    line.style.setProperty('--timeline-columns', `${timelineSlot(minute, timelineAxisFrom(days))} / span 1`);
    line.style.setProperty('--timeline-rows', `${timelineSlot(minute, day.from)} / span 1`);
    line.style.setProperty('--timeline-slot-part', String((minute % TIMELINE_SLOT) / TIMELINE_SLOT));
    track.append(line);
}

// Shows the current time with the programs after it. Its scroll margin in timeline.css keeps it clear of the site's header.
// Until the page has loaded, its fonts and the site's script still move the page, so the scroll waits for it.
function scrollTimelineToNow(timeline) {
    const scroll = () => timeline.querySelector('.cvvz-timeline-now')?.scrollIntoView({
        block: window.innerWidth >= 768 ? 'nearest' : 'start',
        inline: 'start',
    });
    if (document.readyState === 'complete') {
        scroll();
    } else {
        window.addEventListener('load', scroll, { once: true });
    }
}

// The start of the time axis shared by the days on a wide screen.
function timelineAxisFrom(days) {
    return Math.min(...days.map((day) => day.from));
}

// The grid line of the slot of a time, counted from 1 at `from`.
function timelineSlot(minute, from) {
    return Math.floor((minute - from) / TIMELINE_SLOT) + 1;
}

function timelineTime(minute) {
    return `${Math.floor(minute / 60) % 24}:${String(minute % 60).padStart(2, '0')}`;
}
