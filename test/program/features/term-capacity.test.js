import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, enhancePage, readFixture, runContentScripts, textsOf } from '../../helpers.js';

const FEATURE = ['src/program/features/term-capacity.js'];

test('shows the time shorter and the free places and capacity in words, keeping the participants list working', () => {
    let clicks = 0;
    let terms;
    enhancePage(readFixture('program-2025-11.html'), {
        features: FEATURE,
        beforeEnhance: (window, entries) => {
            terms = entries.find((entry) => entry.program.id === '391').original.terms;
            terms.querySelector('.ajax-modal').addEventListener('click', () => clicks++);
        },
    });
    const items = [...terms.querySelectorAll('.dropdown-item')].slice(0, 3);

    assert.deepEqual(textsOf(items.map((item) => item.querySelector('.cvvz-term-time'))), ['Sobota 8:00–9:30', 'Sobota 10:00–11:30', 'Sobota 12:00–13:30']);
    assert.deepEqual(textsOf(items.map((item) => item.querySelector('.ajax-modal'))), ['8 volných míst z 25', '15 volných míst z 25', 'Plno, kapacita 25']);
    assert.equal(items[0].querySelector('.ajax-modal').title, 'Přihlášeno 17 z 25. Kliknutím zobrazíte seznam přihlášených.');
    items[0].querySelector('.ajax-modal').click();
    assert.equal(clicks, 1);
});

test('writes the free places and the people watching for a place in correct Czech, and leaves an unknown form as it is', () => {
    const dom = createPage('<html><body></body></html>');
    runContentScripts(dom, ['src/shared/features.js', ...FEATURE]);
    const format = (text) => {
        const counts = dom.window.document.createElement('span');
        counts.textContent = text;
        dom.window.document.createElement('div').append(counts);
        dom.window.formatTermCapacity(counts);
        return counts.textContent;
    };

    assert.equal(format('24/25/0'), '1 volné místo z 25');
    assert.equal(format('22/25/0'), '3 volná místa z 25');
    assert.equal(format('25/25/3'), 'Plno, kapacita 25 · 3 hlídají volné místo');
    assert.equal(format('25/25/5'), 'Plno, kapacita 25 · 5 hlídá volné místo');
    assert.equal(format('17 z 25'), '17 z 25');
});
