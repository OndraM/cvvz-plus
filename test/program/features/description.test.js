import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhancePage, readFixture } from '../../helpers.js';

const FEATURE = ['src/program/features/description.js'];

function openLongDescription() {
    const { document, entries } = enhancePage(readFixture('program-2026-10.html'), { features: FEATURE });
    const description = document.getElementById('program-644').querySelector('.cvvz-description');
    return {
        document,
        fullText: entries[0].program.description,
        text: description.querySelector('.cvvz-description-text'),
        toggle: description.querySelector('button.cvvz-more'),
    };
}

test('shortens a long description to 25 words, with a button controlling the text', () => {
    const { text, toggle } = openLongDescription();

    assert.ok(text.textContent.startsWith('Elektronika skýtá řadu možností'));
    assert.ok(text.textContent.endsWith('…'));
    assert.equal(text.textContent.split(' ').length, 25);
    assert.equal(toggle.textContent, '» Více');
    assert.equal(toggle.type, 'button');
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(toggle.getAttribute('aria-controls'), text.id);
});

test('the button shows the whole description and shortens it again, keeping the focus', () => {
    const { document, fullText, text, toggle } = openLongDescription();
    const shortText = text.textContent;
    toggle.focus();

    toggle.click();
    assert.equal(text.textContent, fullText);
    assert.equal(toggle.textContent, '« Méně');
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(document.activeElement, toggle);

    toggle.click();
    assert.equal(text.textContent, shortText);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, toggle);
});

test('a click on the shortened text shows the whole description', () => {
    const { fullText, text, toggle } = openLongDescription();

    text.click();

    assert.equal(text.textContent, fullText);
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
});

test('shows a short description whole, without a button', () => {
    const { document } = enhancePage(readFixture('program-2026-10.html'), { features: FEATURE });
    const description = document.getElementById('program-682').querySelector('.cvvz-description');

    assert.equal(description.textContent, 'Vyzkoušíme si odlévání a práci s epoxidovou pryskyřicí, vytvoříme si nějakou drobnost a budeme si povídat o tomto řemesle.');
    assert.equal(description.querySelector('button'), null);
});
