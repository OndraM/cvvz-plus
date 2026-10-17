import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PROGRAM_PAGE = readFixture('program-2026-10.html');
const MY_PROGRAMS_PAGE = readFixture('moje-programy-2026-10.html');
const FEATURE = ['src/site/features/confirm-unregister.js'];
const FULL_NOTE = '\n\nProgram je plný, po odhlášení už nemusí být místo.';

function submit(window, form, answer) {
    const questions = [];
    window.confirm = (question) => {
        questions.push(question);
        return answer;
    };
    let reachedSite = false;
    const siteListener = () => {
        reachedSite = true;
    };
    window.document.body.addEventListener('submit', siteListener);
    const event = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    window.document.body.removeEventListener('submit', siteListener);
    return { questions, sent: reachedSite && !event.defaultPrevented };
}

function termForm(document, termId) {
    return document.querySelector(`li[data-program-time-block-id="${termId}"] form`);
}

function myProgramsPage() {
    return enhancePage(MY_PROGRAMS_PAGE, {
        url: 'https://www.cvvz.cz/moje-programy',
        features: ['src/my-programs/features/timeline.js', ...FEATURE],
        beforeEnhance: (window) => {
            window.setInterval = () => {};
        },
    });
}

test('asks before unregistering from a program on the Program page, and warns when the program is full', () => {
    const { window, document } = enhancePage(PROGRAM_PAGE, { features: FEATURE });

    assert.deepEqual(submit(window, termForm(document, '938'), false), {
        questions: ['Opravdu se odhlásit z programu Jsem hlavas - pro hlavní vedoucí kolektivů s celoroční činností?'],
        sent: false,
    });
    assert.deepEqual(submit(window, termForm(document, '891'), true), {
        questions: [`Opravdu se odhlásit z programu Táborové fuckupy?${FULL_NOTE}`],
        sent: true,
    });
});

test('does not ask when signing up or when stopping to watch for a free place on the Program page', () => {
    const { window, document } = enhancePage(PROGRAM_PAGE, { features: FEATURE });

    for (const form of [termForm(document, '935'), termForm(document, '958'), document.querySelector('#watchdogModal form')]) {
        assert.deepEqual(submit(window, form, false), { questions: [], sent: true });
    }
});

test('asks before unregistering from a program in the list and on the timeline of My programs', () => {
    const { window, document } = myProgramsPage();
    const listForm = document.querySelector('.table-container input[name="id"][value="1001"]').form;
    const timelineForm = document.querySelector('.cvvz-timeline-unregister input[name="id"][value="1006"]').form;

    assert.deepEqual(submit(window, listForm, false), { questions: ['Opravdu se odhlásit z programu Ukázkový program?'], sent: false });
    assert.deepEqual(submit(window, timelineForm, true), { questions: [`Opravdu se odhlásit z programu Ukázková beseda?${FULL_NOTE}`], sent: true });
});

test('does not ask when stopping to watch for a free place on My programs', () => {
    const { window, document } = myProgramsPage();
    const watchedForms = [
        document.querySelector('.table-container input[name="id"][value="1002"]').form,
        document.querySelector('.cvvz-timeline-unregister input[name="id"][value="1007"]').form,
        document.querySelector('#watchdogModal input[name="id"][value="1008"]').form,
    ];

    for (const form of watchedForms) {
        assert.deepEqual(submit(window, form, false), { questions: [], sent: true });
    }
});
