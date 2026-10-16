import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const PAGE = readFixture('moje-programy-2026-10.html');
const FEATURE = ['src/my-programs/features/menu-link.js'];

function menuLink(document) {
    return document.querySelector('.logged-in-submenu a[href="/moje-programy"]').textContent;
}

test('renames the link to the page in the menu of a logged-in user, on every page', () => {
    for (const url of ['https://www.cvvz.cz/moje-programy', 'https://www.cvvz.cz/']) {
        const { document, warnings } = enhancePage(PAGE, { url, features: FEATURE });

        assert.equal(menuLink(document), 'Moje programy');
        assert.deepEqual(warnings, []);
    }
});

test('leaves the link as the site shows it when it has another text', () => {
    const page = PAGE.replace('>Přihlášení na programy<', '>Programy<');
    const { document } = enhancePage(page, { url: 'https://www.cvvz.cz/', features: FEATURE });

    assert.equal(menuLink(document), 'Programy');
});
