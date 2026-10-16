// The programs of the logged-in participant: a table of the site with a row of each time block,
// with the program registered in it, or a link to register for one.

const SCHEDULE_COLUMNS = ['Den', 'Čas', 'Program', 'Přihlášení', 'Místo', 'Hodnocení', 'Doplatek', ''];

// The event goes on after midnight: a block starting before this time is in the night of the evening before.
const SCHEDULE_NIGHT_END = 6 * 60;

function findScheduleTable(document) {
    const table = document.querySelector('.table-container > table');
    if (!table) {
        throw new Error('table of programs not found');
    }
    const headings = [...table.querySelectorAll('thead th')].map((heading) => heading.textContent.trim());
    if (headings.join(', ') !== SCHEDULE_COLUMNS.join(', ')) {
        throw new Error(`unexpected columns: ${headings.join(', ')}`);
    }
    return table;
}

// Reads the rows of the table into [{ date, day, weekday, start, end, program, watched, registerUrl, counts, surcharge, place, rating, unregisterForm }]:
//   date            - "2026-11-13", `day` "13. 11." and `weekday` "pátek" as the site writes them
//   start, end      - minutes from the midnight of the date, after 24 * 60 past it: a block of the night after midnight
//                     belongs to the evening before, when the table has it
//   program         - { title, url } of the registered program, null for a free block, which has `registerUrl` instead
//   watched         - the program is not registered, only watched for a free place: the site marks it by an icon
//   counts          - { registered, capacity, watching } of the program
//   place, rating   - cells of the site, or null when empty: what they hold once filled in is not known yet
//   unregisterForm  - the site's form, which unregisters the participant from the program, or stops watching it
// Throws on anything else in the table, so the features leave the page as the site shows it.
function readSchedule(table) {
    const entries = [...table.tBodies[0].rows].map(readScheduleRow);
    for (const night of entries.filter((entry) => entry.start < SCHEDULE_NIGHT_END)) {
        const evening = entries.find((entry) => entry.date === schedulePreviousDate(night.date) && entry.start >= SCHEDULE_NIGHT_END);
        if (evening) {
            Object.assign(night, { date: evening.date, day: evening.day, weekday: evening.weekday });
            night.start += 24 * 60;
            night.end += 24 * 60;
        }
    }
    return entries;
}

function readScheduleRow(row) {
    if (row.cells.length !== SCHEDULE_COLUMNS.length) {
        throw new Error(`unexpected number of cells: ${row.cells.length}`);
    }
    const [dayCell, timeCell, programCell, countsCell, placeCell, ratingCell, surchargeCell, actionCell] = row.cells;

    const dayText = scheduleText(dayCell);
    const dayMatch = dayText.match(/^(\d{1,2})\. (\d{1,2})\. (\d{4}) ?(\p{L}+)$/u);
    if (!dayMatch) {
        throw new Error(`unexpected day "${dayText}"`);
    }
    const [, dayOfMonth, month, year, weekday] = dayMatch;

    const timeText = scheduleText(timeCell);
    const timeMatch = timeText.match(/^(\d{1,2}):(\d\d)\s*[-\u2013\u2014]\s*(\d{1,2}):(\d\d)$/);
    if (!timeMatch) {
        throw new Error(`unexpected time "${timeText}"`);
    }
    const { start, end } = scheduleTimes(timeMatch.slice(1));

    const entry = {
        date: `${year}-${month.padStart(2, '0')}-${dayOfMonth.padStart(2, '0')}`,
        day: `${dayOfMonth}. ${month}.`,
        weekday,
        start,
        end,
        program: null,
        watched: false,
        registerUrl: null,
        counts: null,
        surcharge: false,
        place: scheduleCellOrNull(placeCell),
        rating: scheduleCellOrNull(ratingCell),
        unregisterForm: null,
    };

    const links = programCell.querySelectorAll('a');
    const url = links[0]?.getAttribute('href') ?? '';
    if (links.length === 1 && url.startsWith('/program#program-')) {
        readScheduleProgram(entry, links[0], countsCell, surchargeCell, actionCell);
    } else if (links.length === 1 && url.startsWith('/program?timeBlock=')) {
        if ([countsCell, surchargeCell, actionCell].some((cell) => scheduleCellOrNull(cell) !== null)) {
            throw new Error('unexpected content of a free block');
        }
        entry.registerUrl = url;
    } else {
        throw new Error(`unexpected program cell "${scheduleText(programCell)}"`);
    }
    return entry;
}

function readScheduleProgram(entry, link, countsCell, surchargeCell, actionCell) {
    entry.program = { title: scheduleText(link), url: link.getAttribute('href') };
    entry.watched = link.parentElement.querySelector('svg') !== null;

    const countsMatch = scheduleText(countsCell).match(/^(\d+)\/(\d+)\/(\d+)$/);
    if (!countsMatch) {
        throw new Error(`unexpected counts "${scheduleText(countsCell)}"`);
    }
    const [registered, capacity, watching] = countsMatch.slice(1).map(Number);
    entry.counts = { registered, capacity, watching };

    entry.surcharge = { Ano: true, Ne: false }[scheduleText(surchargeCell)];
    if (entry.surcharge === undefined) {
        throw new Error(`unexpected surcharge "${scheduleText(surchargeCell)}"`);
    }

    entry.unregisterForm = actionCell.querySelector('form[action="/unregister-program-timeblock"]');
    if (!entry.unregisterForm) {
        throw new Error('missing unregister form');
    }
}

// Minutes from midnight of the hours and minutes of a start and an end; a block past midnight ends after 24 * 60.
function scheduleTimes(parts) {
    const [startHour, startMinute, endHour, endMinute] = parts.map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return { start, end: end <= start ? end + 24 * 60 : end };
}

function scheduleText(element) {
    return element.textContent.replace(/\s+/g, ' ').trim();
}

// A cell holding no text and nothing shown without text, like an image or a button, is empty.
function scheduleCellOrNull(cell) {
    return scheduleText(cell) === '' && cell.querySelector('img, svg, input, button, select') === null ? null : cell;
}

// "2026-11-13" of a date.
function scheduleDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function schedulePreviousDate(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return scheduleDateKey(new Date(year, month - 1, day - 1));
}
