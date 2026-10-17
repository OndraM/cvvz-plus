import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const ANONYMOUS_PAGE = readFixture('program-2025-11.html');
const LOGGED_IN_PAGE = readFixture('program-2026-10.html');
const FEATURE = ['src/program/features/login-hint.js'];

function openPage(html) {
    const timers = [];
    const page = enhancePage(html, {
        features: FEATURE,
        beforeEnhance: (window) => {
            window.setTimeout = (callback, delay) => timers.push({ callback, delay });
        },
    });
    return { ...page, timers };
}

function submit(window, form) {
    let reachedSite = false;
    const siteListener = () => {
        reachedSite = true;
    };
    window.document.body.addEventListener('submit', siteListener);
    const event = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    window.document.body.removeEventListener('submit', siteListener);
    return reachedSite && !event.defaultPrevented;
}

function formWithButton(document, text) {
    return [...document.querySelectorAll('form[action="/register-program-timeblock"]')]
        .find((form) => form.querySelector('button').textContent.trim() === text);
}

test('asks a visitor who is not logged in to log in first, when signing up or watching for a free place', () => {
    const { window, document, timers, warnings } = openPage(ANONYMOUS_PAGE);
    const container = document.querySelector('.toast-container');

    assert.deepEqual(warnings, []);
    assert.equal(submit(window, formWithButton(document, 'Přihlásit se')), false);
    assert.equal(submit(window, formWithButton(document, 'Hlídat volné místo')), false);

    const toasts = container.querySelectorAll('.toast.text-bg-danger');
    assert.deepEqual([...toasts].map((toast) => toast.textContent), Array(2).fill('Nejdřív se musíte přihlásit ke svému účtu.'));
    assert.deepEqual([...toasts].map((toast) => toast.querySelector('a').getAttribute('href')), ['/login', '/login']);
    assert.deepEqual(timers.map((timer) => timer.delay), [5000, 5000]);
    timers.forEach((timer) => timer.callback());
    assert.equal(container.querySelectorAll('.toast').length, 0);
});

test('leaves signing up of a logged-in visitor to the site', () => {
    const { window, document } = openPage(LOGGED_IN_PAGE);

    assert.equal(submit(window, document.querySelector('li[data-program-time-block-id="935"] form')), true);
    assert.equal(document.querySelectorAll('.toast-container .toast').length, 0);
});
