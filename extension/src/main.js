// Entry point, loaded last: runs the features of the pages the current URL belongs to.

// Pages with features, each in its own folder src/<page>/. A feature names its page in `page`.
const PAGES = {
    site: () => true,
    program: (location) => location.pathname === '/program',
};

function runFeatures() {
    if (document.documentElement.hasAttribute('data-cvvz-plus')) {
        return;
    }
    document.documentElement.setAttribute('data-cvvz-plus', '');

    const features = FEATURES.filter((feature) => PAGES[feature.page](document.location));
    const failures = [];

    if (PAGES.program(document.location)) {
        failures.push(...enhanceProgramList(features.filter((feature) => feature.page === 'program')));
    }
    for (const feature of features) {
        try {
            feature.enhancePage?.(document);
        } catch (error) {
            failures.push({ id: `${feature.page}/${feature.name}`, reason: error.message });
        }
    }

    if (failures.length > 0) {
        console.warn('CVVZ plus: některé části stránky zůstaly v původní podobě', failures);
    }
}

runFeatures();
