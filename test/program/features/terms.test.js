import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const FEATURE = ['src/program/features/terms.js'];

test('moves the dates into the program and keeps their click listeners', () => {
    let clicks = 0;
    const { document } = enhancePage(readFixture('program-2025-11.html'), {
        features: FEATURE,
        beforeEnhance: (window, entries) => {
            const terms = entries.find((entry) => entry.program.id === '391').original.terms;
            terms.querySelector('.ajax-modal').addEventListener('click', () => clicks++);
        },
    });
    const section = document.getElementById('program-391');

    assert.equal(section.querySelectorAll('.program-dates-dropdown li').length, 13);
    section.querySelector('.ajax-modal').click();
    assert.equal(clicks, 1);
    assert.equal(section.querySelector('.cvvz-no-terms'), null);
});

test('shows a message when the program has no dates', () => {
    const { document } = enhancePage(readFixture('program-2026-10.html'), { features: FEATURE });
    const section = document.getElementById('program-644');

    assert.equal(section.querySelector('.cvvz-no-terms').textContent, '🚫 Program zatím nemá vypsané žádné termíny');
    assert.ok(section.querySelector('.program-dates-dropdown'));
});
