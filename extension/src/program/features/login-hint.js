registerFeature({
    page: 'program',
    name: 'login-hint',
    label: 'Místo obecné chyby napsat, že je potřeba se nejdřív přihlásit',

    enhancePage(document) {
        if (!document.querySelector('header a[href="/login"]')) {
            return;
        }
        const container = document.querySelector('.toast-container');
        if (!container) {
            throw new Error('container of the site messages not found');
        }

        document.addEventListener('submit', (event) => {
            if (event.target.matches('form[action="/register-program-timeblock"]')) {
                event.preventDefault();
                event.stopImmediatePropagation();
                showLoginHintToast(container);
            }
        }, true);
    },
});

function showLoginHintToast(container) {
    const toast = buildElement('div', 'toast show text-bg-danger p-3', 'Nejdřív se musíte ');
    toast.setAttribute('role', 'alert');
    const link = buildElement('a', 'text-reset fw-bold', 'přihlásit ke svému účtu');
    link.href = '/login';
    toast.append(link, '.');
    container.append(toast);
    setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}
