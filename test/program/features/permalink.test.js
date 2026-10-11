import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE_2026 = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/permalink.js'];

function openPage(url) {
    const scrolledTo = [];
    const { document } = enhancePage(PAGE_2026, {
        url,
        features: FEATURE,
        beforeEnhance: (window) => {
            window.Element.prototype.scrollIntoView = function () {
                scrolledTo.push(this.id);
            };
        },
    });
    return { document, scrolledTo };
}

test('adds a link to the program into its header', () => {
    const { document } = openPage('https://www.cvvz.cz/program');
    const link = document.getElementById('program-644').querySelector('.cvvz-header a.cvvz-permalink');

    assert.equal(link.getAttribute('href'), '#program-644');
    assert.equal(link.textContent, '🔗');
});

test('scrolls to the program linked in the URL after the layout changed', () => {
    assert.deepEqual(openPage('https://www.cvvz.cz/program#program-682').scrolledTo, ['program-682']);
});

test('does not scroll without a link to a program', () => {
    assert.deepEqual(openPage('https://www.cvvz.cz/program').scrolledTo, []);
    assert.deepEqual(openPage('https://www.cvvz.cz/program#program_filter_form').scrolledTo, []);
});
