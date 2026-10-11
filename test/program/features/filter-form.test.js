import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const FEATURE = ['src/program/features/filter-form.js'];

test('adds spacing below the filter form', () => {
    const { document } = enhancePage(readFixture('program-2026-10.html'), { features: FEATURE });

    assert.ok(document.getElementById('program_filter_form').classList.contains('cvvz-filter-form'));
});

test('does nothing on a page without the filter form', () => {
    const { warnings } = enhancePage('<html><body></body></html>', { features: FEATURE });

    assert.deepEqual(warnings, []);
});
