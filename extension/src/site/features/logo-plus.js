registerFeature({
    page: 'site',
    name: 'logo-plus',
    label: 'Přidat ikonku ➕ k logu v záhlaví webu (jako znamení, že je rozšíření zapnuto)',

    enhancePage(document) {
        const logoLink = document.querySelector('header a.navbar-brand');
        if (!logoLink) {
            throw new Error('logo not found');
        }
        const sign = buildElement('span', 'cvvz-logo-plus cvvz-plus', 'Plus');
        sign.title = 'Web je vylepšen neoficiálním rozšířením CVVZ plus. Ať slouží!';
        logoLink.append(sign);
    },
});
