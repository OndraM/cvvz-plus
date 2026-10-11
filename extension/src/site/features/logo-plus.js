registerFeature({
    page: 'site',
    name: 'logo-plus',
    description: 'Adds a small "Plus" sign next to the logo in the page header, so it is clear the site is changed by the extension.',

    enhancePage(document) {
        const logoLink = document.querySelector('header a.navbar-brand');
        if (!logoLink) {
            throw new Error('logo not found');
        }
        const sign = buildElement('span', 'cvvz-logo-plus', 'Plus');
        sign.title = 'Web je vylepšen neoficiálním rozšířením CVVZ plus. Ať slouží!';
        logoLink.append(sign);
    },
});
