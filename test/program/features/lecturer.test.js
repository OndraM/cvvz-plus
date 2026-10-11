import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const FEATURE = ['src/program/features/lecturer.js'];

test('shows the lecturer with a link to the bio and to all programs of the lecturer', () => {
    const { document } = enhancePage(readFixture('program-2026-10.html'), { features: FEATURE });
    const lecturer = document.getElementById('program-682').querySelector('.cvvz-lecturer');
    const [nameLink, programsLink] = lecturer.querySelectorAll('a');

    assert.equal(lecturer.textContent, '👤 Daniel Bartoš · další programy lektora');
    assert.equal(nameLink.dataset.bsToggle, 'modal');
    assert.equal(nameLink.dataset.bsTarget, '#lecturerBioModal-123');
    assert.equal(programsLink.getAttribute('href'), '/program?program_filter%5Blecturer%5D=Daniel%20Barto%C5%A1');
});

test('shows nothing for a program without a lecturer', () => {
    const { document } = enhancePage(readFixture('program-2025-11.html'), { features: FEATURE });

    assert.equal(document.getElementById('program-299').querySelector('.cvvz-lecturer'), null);
});
