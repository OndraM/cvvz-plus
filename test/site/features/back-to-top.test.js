import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

function openPage() {
    const scrolls = [];
    const { window, document } = enhancePage(readFixture('program-2026-10.html'), {
        features: ['src/site/features/back-to-top.js'],
        beforeEnhance: (window) => {
            window.scrollTo = (x, y) => scrolls.push([x, y]);
        },
    });
    return { window, scrolls, button: document.querySelector('button.cvvz-back-to-top') };
}

test('adds a button that scrolls back to the top', () => {
    const { scrolls, button } = openPage();

    button.click();

    assert.deepEqual(scrolls, [[0, 0]]);
});

test('shows the button only after scrolling down more than one screen', () => {
    const { window, button } = openPage();
    assert.equal(button.classList.contains('cvvz-back-to-top-visible'), false);

    Object.defineProperty(window, 'scrollY', { value: window.innerHeight * 3, configurable: true });
    window.dispatchEvent(new window.Event('scroll'));

    assert.ok(button.classList.contains('cvvz-back-to-top-visible'));
});
