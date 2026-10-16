registerFeature({
    page: 'my-programs',
    name: 'menu-link',
    label: 'Přejmenovat v menu Přihlášení na programy na Moje programy',

    enhanceSite(document) {
        for (const link of document.querySelectorAll('a[href="/moje-programy"]')) {
            if (link.textContent.trim() === 'Přihlášení na programy') {
                link.textContent = 'Moje programy';
            }
        }
    },
});
