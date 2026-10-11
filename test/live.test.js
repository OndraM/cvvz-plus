// Checks the extension against the current live page (needs network): npm run test:live
// When it fails, the site HTML changed: save the page as a new fixture (see README) and adjust the parser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, findIncompletePrograms } from './helpers.js';

const PROGRAM_URL = 'https://www.cvvz.cz/program';

test('the extension understands every program on the live page and shows all its information', async () => {
    const response = await fetch(PROGRAM_URL);
    assert.equal(response.status, 200);

    const { document, entries, warnings } = enhancePage(await response.text(), { url: PROGRAM_URL });

    assert.deepEqual(warnings.map(([, failures]) => structuredClone(failures)), [], 'some programs or features failed');
    assert.ok(entries.length > 0, 'no programs found');
    assert.deepEqual(findIncompletePrograms(document, entries), []);
    console.log(`Checked ${entries.length} programs on ${PROGRAM_URL}`);
});
