const OPTIONS_PAGE_TITLES = {
    site: 'Celý web',
    program: 'Stránka Program',
};

function renderOptions(form, disabledIds) {
    for (const [page, title] of Object.entries(OPTIONS_PAGE_TITLES)) {
        const group = buildElement('fieldset');
        group.append(buildElement('legend', '', title));
        for (const feature of FEATURES.filter((feature) => feature.page === page)) {
            const checkbox = buildElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = featureId(feature);
            checkbox.checked = !disabledIds.includes(checkbox.value);

            const label = buildElement('label');
            label.append(checkbox, ' ', feature.label);
            group.append(label);
        }
        form.append(group);
    }

    form.addEventListener('change', () => {
        const unchecked = [...form.querySelectorAll('input:not(:checked)')];
        saveDisabledFeatureIds(unchecked.map((checkbox) => checkbox.value));
    });
}

loadDisabledFeatureIds((disabledIds) => renderOptions(document.getElementById('features'), disabledIds));
