registerFeature({
    page: 'program',
    name: 'labels',
    description: 'Shows the program labels (štítky) and its details from the collapsed "Další podrobnosti" table '
        + '(physical demands, interaction, difficulty, surcharge) as one row of labels. An empty or zero surcharge is not shown.',

    renderProgram(program, layout) {
        const row = buildElement('p', 'cvvz-labels');
        for (const label of program.labels) {
            const badge = buildElement('span', 'badge rounded-pill cvvz-badge', label.name);
            badge.style.backgroundColor = label.color;
            row.append(badge);
        }
        if (program.physicalLevel) {
            row.append(buildElement('span', 'cvvz-label', `🏋️ Fyzická náročnost: ${program.physicalLevel}`));
        }
        if (program.interactionLevel) {
            row.append(buildElement('span', 'cvvz-label', `🤝 Interakce: ${program.interactionLevel}`));
        }
        if (program.difficulty) {
            const difficulty = program.difficulty.replace(/\s*znalosti$/, '');
            row.append(buildElement('span', 'cvvz-label', `📊 Obtížnost: ${difficulty}`));
        }
        if (program.surcharge && program.surcharge !== '0') {
            row.append(buildElement('span', 'cvvz-label', `💰 Doplatek: ${program.surcharge}`));
        }

        if (row.children.length > 0) {
            layout.section.append(row);
        }
    },
});
