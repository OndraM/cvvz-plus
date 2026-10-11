import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const FEATURE = ['src/site/features/logo-plus.js'];

test('adds a small "Plus" sign next to the logo, on the homepage and on the program page', () => {
    const pages = [
        [readFixture('homepage-2026-10.html'), 'https://www.cvvz.cz/'],
        [readFixture('program-2026-10.html'), 'https://www.cvvz.cz/program'],
    ];
    for (const [html, url] of pages) {
        const { document } = enhancePage(html, { url, features: FEATURE });
        const sign = document.querySelector('header a.navbar-brand > .cvvz-logo-plus');

        assert.equal(sign.textContent, 'Plus');
        assert.equal(sign.previousElementSibling.tagName, 'IMG');
    }
});

test('reports a page without the logo', () => {
    const { warnings } = enhancePage('<html><body></body></html>', { url: 'https://www.cvvz.cz/', features: FEATURE });

    assert.deepEqual(structuredClone(warnings[0][1]), [{ id: 'site/logo-plus', reason: 'logo not found' }]);
});
