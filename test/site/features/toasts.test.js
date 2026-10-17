import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const CONTAINER = '<div class="toast-container position-fixed top-0 start-50 translate-middle-x p-5 mt-5">';

function openPage(html) {
    const timers = [];
    const page = enhancePage(html, {
        features: ['src/site/features/toasts.js'],
        beforeEnhance: (window) => {
            window.setTimeout = (callback, delay) => timers.push({ callback, delay });
            window.document.querySelector('header.fixed-top').getBoundingClientRect = () => ({ bottom: 144 });
        },
    });
    return { ...page, timers };
}

test('moves the messages of the site below the header with the menu of the logged-in user, above the windows of the site', () => {
    const { document, warnings } = openPage(readFixture('program-2026-10.html'));
    const container = document.querySelector('.toast-container');

    assert.deepEqual(warnings, []);
    assert.equal(container.parentElement, document.body);
    assert.equal(container.style.getPropertyValue('top'), '144px');
    assert.equal(container.style.getPropertyPriority('top'), 'important');
});

test('removes each message after 5 seconds, also the ones the site adds after an action', async () => {
    const html = readFixture('program-2026-10.html').replace(CONTAINER, `${CONTAINER}<div class="toast">Přihlášení proběhlo.</div>`);
    const { document, timers } = openPage(html);
    const container = document.querySelector('.toast-container');

    const added = document.createElement('div');
    added.className = 'toast show text-bg-success p-3';
    container.append(added);
    await new Promise((resolve) => setTimeout(resolve));

    assert.deepEqual(timers.map((timer) => timer.delay), [5000, 5000]);
    assert.equal(container.querySelectorAll('.toast').length, 2);
    timers.forEach((timer) => timer.callback());
    assert.equal(container.querySelectorAll('.toast').length, 0);
});
