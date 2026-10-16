// Tabs above the panels of a page: a click on a tab shows its panel and hides the panels of the others.
// `tabs` are [{ content, panel }], `content` the texts and elements of the tab.
// `onSelect(index)` is called after a click, so the page can remember the open tab its own way.
// Returns the row of tabs and `selectTab(index)`, which opens a tab.
function buildTabs(tabs, onSelect) {
    const row = buildElement('div', 'cvvz-tabs');
    row.setAttribute('role', 'tablist');
    const buttons = tabs.map(({ content }) => {
        const button = buildElement('button', 'cvvz-tab');
        button.type = 'button';
        button.setAttribute('role', 'tab');
        button.append(...content);
        return button;
    });
    const selectTab = (selected) => {
        buttons.forEach((button, index) => button.setAttribute('aria-selected', String(index === selected)));
        tabs.forEach(({ panel }, index) => panel.classList.toggle('cvvz-hidden', index !== selected));
    };
    buttons.forEach((button, index) => button.addEventListener('click', () => {
        selectTab(index);
        onSelect(index);
    }));
    row.append(...buttons);
    return { row, selectTab };
}
