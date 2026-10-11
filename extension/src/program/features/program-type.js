const PROGRAM_TYPE_TAGS = {
    'Rukodělná aktivita': '🖐️ Rukodělka',
    'Přednáška': '🧑‍🏫 Přednáška',
    'Diskuse': '💬 Diskuse',
    'Workshop': '🛠️ Workshop',
    'Pohybová aktivita': '🤸 Pohybovka',
    'Výlet/exkurze': '🎒 Výlet/exkurze',
};

registerFeature({
    page: 'program',
    name: 'program-type',
    label: 'Zobrazit typ programu (provedení) jako štítek s emoji v záhlaví programu',
    shows: ['type'],

    renderProgram(program, layout) {
        if (!program.type || program.type === 'Jiné') {
            return;
        }
        const tag = PROGRAM_TYPE_TAGS[program.type] ?? program.type;
        layout.header.append(' ', buildElement('span', 'cvvz-type', tag));
    },
});
