const TOAST_DURATION_MS = 5000;

registerFeature({
    page: 'site',
    name: 'toasts',
    label: 'Posunout hlášky webu pod menu a zkrátit je na 5 sekund',

    enhancePage(document) {
        const container = document.querySelector('.toast-container');
        const header = document.querySelector('header.fixed-top');
        const placeBelowHeader = () => container.style.setProperty('top', `${header.getBoundingClientRect().bottom}px`, 'important');
        container.classList.add('cvvz-toasts');
        placeBelowHeader();

        container.querySelectorAll('.toast').forEach(removeToastLater);
        new MutationObserver((mutations) => {
            placeBelowHeader();
            const toasts = mutations.flatMap((mutation) => [...mutation.addedNodes]).filter((node) => node.matches?.('.toast'));
            toasts.forEach(removeToastLater);
        }).observe(container, { childList: true });
    },
});

function removeToastLater(toast) {
    setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}
