const LABELS_LEVEL_DOTS = { 'Malá': 1, 'Střední': 2, 'Velká': 3 };
const LABELS_DIFFICULTIES = { 'Základní znalosti': 'Pro začátečníky', 'Pokročilé znalosti': 'Pro pokročilé' };

registerFeature({
    page: 'program',
    name: 'labels',
    label: 'Zobrazit parametry programu jako štítky (místo ve schované tabulce)',
    shows: ['labels', 'physicalLevel', 'interactionLevel', 'difficulty', 'surcharge'],

    renderProgram(program, layout) {
        const row = buildElement('p', 'cvvz-labels');
        for (const label of program.labels) {
            const badge = buildElement('span', 'cvvz-badge', label.name);
            badge.style.setProperty('--cvvz-label-color', label.color);
            row.append(badge);
        }
        if (program.physicalLevel) {
            row.append(renderLevel('🏋️', 'Fyzická náročnost', program.physicalLevel));
        }
        if (program.interactionLevel) {
            row.append(renderLevel('🤝', 'Interakce', program.interactionLevel));
        }
        if (program.difficulty) {
            const difficulty = buildElement('span', 'cvvz-parameter', `📊 ${LABELS_DIFFICULTIES[program.difficulty] ?? program.difficulty}`);
            difficulty.title = `Úroveň obtížnosti: ${program.difficulty}`;
            difficulty.classList.toggle('cvvz-advanced', program.difficulty === 'Pokročilé znalosti');
            row.append(difficulty);
        }
        if (program.surcharge && program.surcharge !== '0') {
            row.append(buildElement('span', 'cvvz-parameter', `💰 Doplatek: ${program.surcharge}`));
        }

        if (row.children.length > 0) {
            layout.section.append(row);
        }
    },
});

function renderLevel(emoji, name, level) {
    const item = buildElement('span', 'cvvz-parameter cvvz-level', `${emoji} ${name} `);
    const dotCount = LABELS_LEVEL_DOTS[level];
    if (dotCount === undefined) {
        item.append(level);
        return item;
    }

    item.title = `${name}: ${level}`;
    const dots = buildElement('span', 'cvvz-dots');
    for (let i = 1; i <= 3; i++) {
        dots.append(buildElement('span', i <= dotCount ? 'cvvz-dot cvvz-dot-on' : 'cvvz-dot'));
    }
    item.append(dots, buildElement('span', 'cvvz-visually-hidden', level));
    return item;
}
