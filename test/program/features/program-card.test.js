import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

test('puts every program into a card', () => {
    const { document } = enhancePage(readFixture('program-2026-10.html'), { features: ['src/program/features/program-card.js'] });

    assert.equal(document.querySelectorAll('section.cvvz-program.cvvz-card').length, 110);
});
