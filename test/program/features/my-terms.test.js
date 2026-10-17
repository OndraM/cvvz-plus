import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/my-terms.js'];

function idsOf(elements) {
    return [...elements].map((element) => element.id || element.dataset.programTimeBlockId);
}

function replaceTermForm(document, termId, action, buttonText) {
    document.querySelector(`li[data-program-time-block-id="${termId}"] form`).outerHTML = `
        <form action="${action}" method="post" class="ms-auto js-program-action" data-program-time-block-id="${termId}">
            <input type="hidden" name="id" value="1">
            <button type="submit" class="btn btn-link btn-sm p-0 color-primary color-primary-on-hover underline fw-bold">${buttonText}</button>
        </form>`;
}

test('marks the programs and terms the user is registered to or watches for a free place', () => {
    const { document } = enhancePage(PAGE, { features: FEATURE });

    assert.deepEqual(idsOf(document.querySelectorAll('section.cvvz-registered')), ['program-768', 'program-638', 'program-704', 'program-769', 'program-713']);
    assert.deepEqual(idsOf(document.querySelectorAll('section.cvvz-watching')), ['program-647', 'program-759']);
    assert.deepEqual(idsOf(document.querySelectorAll('li.cvvz-registered')), ['859', '938', '913', '860', '891']);
    assert.deepEqual(idsOf(document.querySelectorAll('li.cvvz-watching')), ['958', '886']);
});

test('follows the buttons the site replaces after signing up or out, without reloading the page', async () => {
    const { document } = enhancePage(PAGE, { features: FEATURE });

    replaceTermForm(document, '938', '/register-program-timeblock', 'Přihlásit se');
    replaceTermForm(document, '951', '/unregister-program-timeblock', 'Deaktivovat hlídacího psa');
    await new Promise((resolve) => setTimeout(resolve));

    assert.equal(document.getElementById('program-638').classList.contains('cvvz-registered'), false);
    assert.equal(document.querySelector('li[data-program-time-block-id="938"]').classList.contains('cvvz-registered'), false);
    assert.ok(document.getElementById('program-620').classList.contains('cvvz-watching'));
    assert.ok(document.querySelector('li[data-program-time-block-id="951"]').classList.contains('cvvz-watching'));
});
