import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE_2026 = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/permalink.js'];

function openPage(url, { clipboard } = {}) {
    const scrolledTo = [];
    const { window, document } = enhancePage(PAGE_2026, {
        url,
        features: FEATURE,
        beforeEnhance: (window) => {
            window.Element.prototype.scrollIntoView = function () {
                scrolledTo.push(this.id);
            };
            Object.defineProperty(window.navigator, 'clipboard', { value: clipboard });
        },
    });
    return { window, document, scrolledTo, link: document.getElementById('program-644').querySelector('.cvvz-header a.cvvz-permalink') };
}

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

test('adds an icon link to the program into its header', () => {
    const { link } = openPage('https://www.cvvz.cz/program');

    assert.equal(link.getAttribute('href'), '#program-644');
    assert.equal(link.getAttribute('aria-label'), 'Zkopírovat odkaz na program');
    assert.ok(link.querySelector('svg.cvvz-permalink-link'));
});

test('a click copies the link to the program and confirms it', async () => {
    const copied = [];
    const { window, link } = openPage('https://www.cvvz.cz/program?program_filter%5Btype%5D=workshop', {
        clipboard: { writeText: async (text) => copied.push(text) },
    });

    link.click();
    await flushPromises();

    assert.deepEqual(copied, ['https://www.cvvz.cz/program#program-644']);
    assert.ok(link.classList.contains('cvvz-copied'));
    assert.equal(link.querySelector('.cvvz-permalink-done').textContent, 'Zkopírováno');
    assert.equal(window.location.hash, '');
});

test('without access to the clipboard, a click goes to the program', async () => {
    const { window, link } = openPage('https://www.cvvz.cz/program', {
        clipboard: { writeText: async () => { throw new Error('denied'); } },
    });

    link.click();
    await flushPromises();

    assert.equal(window.location.hash, '#program-644');
});

test('scrolls to the program linked in the URL after the layout changed', async () => {
    const { scrolledTo } = openPage('https://www.cvvz.cz/program#program-682');
    assert.deepEqual(scrolledTo, []);

    await flushPromises();
    assert.deepEqual(scrolledTo, ['program-682']);
});

test('does not scroll without a link to a program', async () => {
    const pages = [openPage('https://www.cvvz.cz/program'), openPage('https://www.cvvz.cz/program#program_filter_form')];
    await flushPromises();

    assert.deepEqual(pages.map((page) => page.scrolledTo), [[], []]);
});
