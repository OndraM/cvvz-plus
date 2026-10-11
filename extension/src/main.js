// Entry point, loaded last: runs the enabled features of the pages the current URL belongs to.

// Pages with features, each in its own folder src/<page>/. A feature names its page in `page`.
const PAGES = {
    site: () => true,
    program: (location) => location.pathname === '/program',
    participants: (location) => location.pathname === '/prihlaseni-ucastnici',
};

function runFeatures() {
    if (document.documentElement.hasAttribute('data-cvvz-plus')) {
        return;
    }
    document.documentElement.setAttribute('data-cvvz-plus', '');

    loadDisabledFeatureIds(runEnabledFeatures);
}

function runEnabledFeatures(disabledIds) {
    const features = FEATURES.filter((feature) => PAGES[feature.page](document.location) && !disabledIds.includes(featureId(feature)));
    const failures = [];

    if (PAGES.program(document.location)) {
        failures.push(...enhanceProgramList(features.filter((feature) => feature.page === 'program')));
    }
    for (const feature of features) {
        try {
            feature.enhancePage?.(document);
        } catch (error) {
            failures.push({ id: featureId(feature), reason: error.message });
        }
    }

    if (failures.length > 0) {
        console.warn('CVVZ plus: některé části stránky zůstaly v původní podobě', failures);
    }
}

runFeatures();
