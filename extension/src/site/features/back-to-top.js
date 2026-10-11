registerFeature({
    page: 'site',
    name: 'back-to-top',
    label: 'Přidat na mobilu tlačítko pro odscrollování zpět nahoru',

    enhancePage(document) {
        const button = buildElement('button', 'cvvz-back-to-top', '↑ Nahoru');
        button.type = 'button';
        button.addEventListener('click', () => window.scrollTo(0, 0));
        document.body.append(button);

        const update = () => button.classList.toggle('cvvz-back-to-top-visible', window.scrollY > window.innerHeight);
        window.addEventListener('scroll', update, { passive: true });
        update();
    },
});
