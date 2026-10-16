// The site's button "Hlídací pes" floats over the content of every page of a logged-in user. Here it is an item
// of the user's menu instead, opening the same window of the site, with the number of the programs listed in it.
// The site's button is hidden by watchdog.css.

registerFeature({
    page: 'site',
    name: 'watchdog',
    label: 'Přesunout plovoucí tlačítko Hlídací pes do menu přihlášeného uživatele',

    enhancePage(document) {
        const button = document.querySelector('button.sticky-side-block[data-bs-target="#watchdogModal"]');
        const programPage = document.getElementById('program-page');
        if (!button && !programPage) {
            return;
        }
        const programsItem = document.querySelector('.logged-in-submenu nav a[href="/moje-programy"]')?.closest('li');
        if (!programsItem) {
            if (!button) {
                return;
            }
            throw new Error('menu of the logged-in user not found');
        }

        // A link, styled by the site as the other items of the menu. It opens the window by the site's own
        // attributes, as the site's button does.
        const link = buildElement('a', 'cvvz-watchdog', 'Hlídací pes');
        link.href = '#watchdogModal';
        link.setAttribute('role', 'button');
        link.dataset.bsToggle = 'modal';
        link.dataset.bsTarget = '#watchdogModal';
        const count = buildElement('span', 'cvvz-watchdog-count');
        link.append(count);
        const item = buildElement('li');
        item.append(link);

        const update = () => {
            if (!document.getElementById('watchdogModal')) {
                item.remove();
                return;
            }
            if (!item.isConnected) {
                programsItem.after(item);
            }
            updateWatchdogCount(document, count);
        };
        update();
        if (programPage) {
            new MutationObserver(update).observe(programPage, { childList: true });
        }
    },
});

function updateWatchdogCount(document, count) {
    const watched = document.querySelectorAll('#watchdogModal .watchdog-item').length;
    count.textContent = watched > 0 ? String(watched) : '';
}
