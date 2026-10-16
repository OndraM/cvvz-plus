import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture, textsOf } from '../../helpers.js';

const PAGE = readFixture('moje-programy-2026-10.html');
const FEATURE = ['src/site/features/watchdog.js'];

function menuItems(document) {
    return textsOf(document.querySelectorAll('.logged-in-submenu nav li'));
}

test('moves the button into the menu of the logged-in user, with the number of watched programs, on every page', () => {
    for (const url of ['https://www.cvvz.cz/moje-programy', 'https://www.cvvz.cz/program']) {
        const { document, warnings } = enhancePage(PAGE, { url, features: FEATURE });
        const link = document.querySelector('.logged-in-submenu a.cvvz-watchdog');

        assert.deepEqual(warnings, []);
        assert.deepEqual(menuItems(document).slice(0, 3), ['Přihlášení na programy', 'Hlídací pes3', 'Ubytování']);
        assert.equal(link.querySelector('.cvvz-watchdog-count').textContent, '3');
        assert.equal(link.dataset.bsToggle, 'modal');
        assert.equal(link.dataset.bsTarget, '#watchdogModal');
        // The site's button is hidden by watchdog.css, while the feature is not marked off.
        assert.equal(document.documentElement.dataset.cvvzOff, '');
    }
});

test('shows no number without watched programs', () => {
    const page = PAGE.replace(/<div class="watchdog-item[\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*<\/div>/g, '');
    const { document } = enhancePage(page, { url: 'https://www.cvvz.cz/moje-programy', features: FEATURE });

    assert.equal(document.querySelectorAll('#watchdogModal .watchdog-item').length, 0);
    assert.equal(document.querySelector('.cvvz-watchdog').textContent, 'Hlídací pes');
});

function openProgramPage({ watchdog = true } = {}) {
    let block;
    const page = enhancePage(PAGE, {
        url: 'https://www.cvvz.cz/program',
        features: FEATURE,
        beforeEnhance: (window) => {
            const programPage = window.document.createElement('div');
            programPage.id = 'program-page';
            block = window.document.createElement('div');
            block.id = 'program-watchdog';
            const button = window.document.querySelector('.sticky-side-block');
            button.before(programPage);
            block.append(button, window.document.getElementById('watchdogModal'));
            if (watchdog) {
                programPage.append(block);
            }
        },
    });
    const { document } = page;
    const updateBlock = (itemCount) => {
        const current = document.getElementById('program-watchdog');
        const fresh = itemCount > 0 ? block.cloneNode(true) : null;
        [...(fresh?.querySelectorAll('.watchdog-item') ?? [])].slice(itemCount).forEach((item) => item.remove());
        if (current && fresh) {
            current.replaceWith(fresh);
        } else if (current) {
            current.remove();
        } else if (fresh) {
            document.getElementById('program-page').append(fresh);
        }
        return new Promise((resolve) => setTimeout(resolve));
    };
    return { ...page, updateBlock };
}

test('updates the number when the site replaces the watched programs after an action on the Program page', async () => {
    const { document, updateBlock } = openProgramPage();
    assert.equal(document.querySelector('.cvvz-watchdog').textContent, 'Hlídací pes3');

    await updateBlock(2);
    assert.equal(document.querySelector('.cvvz-watchdog').textContent, 'Hlídací pes2');
});

test('removes the item after the last watched program on the Program page, and adds it after the first one', async () => {
    const { document, updateBlock } = openProgramPage();

    await updateBlock(0);
    assert.equal(document.querySelector('.cvvz-watchdog'), null);

    await updateBlock(1);
    assert.deepEqual(menuItems(document).slice(0, 3), ['Přihlášení na programy', 'Hlídací pes1', 'Ubytování']);
});

test('adds the item after the first watched program on the Program page without watched programs', async () => {
    const { document, warnings, updateBlock } = openProgramPage({ watchdog: false });
    assert.equal(document.querySelector('.cvvz-watchdog'), null);
    assert.deepEqual(warnings, []);

    await updateBlock(1);
    assert.equal(document.querySelector('.cvvz-watchdog').textContent, 'Hlídací pes1');
    assert.equal(document.documentElement.dataset.cvvzOff, '');
});

test('changes nothing for a visitor who is not logged in', () => {
    const { document, warnings } = enhancePage(readFixture('homepage-2026-10.html'), { url: 'https://www.cvvz.cz/', features: FEATURE });

    assert.equal(document.querySelector('.cvvz-watchdog, .cvvz-hidden'), null);
    assert.deepEqual(warnings, []);
});

test('leaves the button as the site shows it when the menu is not there', () => {
    const page = PAGE.replace('<li><a href="/moje-programy">', '<li><a href="/moje-prihlasky">');
    const { document, warnings } = enhancePage(page, { url: 'https://www.cvvz.cz/moje-programy', features: FEATURE });

    assert.equal(document.querySelector('.cvvz-watchdog, .cvvz-hidden'), null);
    assert.deepEqual(structuredClone(warnings[0][1]), [{ id: 'site/watchdog', reason: 'menu of the logged-in user not found' }]);
    assert.equal(document.documentElement.dataset.cvvzOff, 'site/watchdog');
});
