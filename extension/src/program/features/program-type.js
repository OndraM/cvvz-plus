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
    description: 'Shows the program type (Provedení) as a tag with an emoji in the program header. '
        + 'The type "Jiné" is not shown, as it says nothing; an unknown type is shown as it is.',

    renderProgram(program, layout) {
        if (!program.type || program.type === 'Jiné') {
            return;
        }
        const tag = PROGRAM_TYPE_TAGS[program.type] ?? program.type;
        layout.header.append(' ', buildElement('span', 'cvvz-type', tag));
    },
});
