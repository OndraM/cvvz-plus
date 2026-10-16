// Entry point, loaded last: runs the enabled features of the pages the current URL belongs to.

// Pages with features, each in its own folder src/<page>/. A feature names its page in `page`.
const PAGES = {
    site: () => true,
    program: (location) => location.pathname === '/program',
    participants: (location) => location.pathname === '/prihlaseni-ucastnici',
    'my-programs': (location) => location.pathname === '/moje-programy',
};

function runFeatures() {
    if (document.documentElement.hasAttribute('data-cvvz-plus')) {
        return;
    }
    document.documentElement.setAttribute('data-cvvz-plus', '');

    loadDisabledFeatureIds(runEnabledFeatures);
}

function runEnabledFeatures(disabledIds) {
    markFeaturesOff(disabledIds);
    const enabledFeatures = FEATURES.filter((feature) => !disabledIds.includes(featureId(feature)));
    const features = enabledFeatures.filter((feature) => PAGES[feature.page](document.location));
    const failures = [];

    if (PAGES.program(document.location)) {
        failures.push(...enhanceProgramList(features.filter((feature) => feature.page === 'program')));
    }
    for (const feature of enabledFeatures) {
        try {
            feature.enhanceSite?.(document);
            if (features.includes(feature)) {
                feature.enhancePage?.(document);
            }
        } catch (error) {
            failures.push({ id: featureId(feature), reason: error.message });
        }
    }

    if (failures.length > 0) {
        markFeaturesOff([...disabledIds, ...failures.map((failure) => failure.id)]);
        console.warn('CVVZ plus: některé části stránky zůstaly v původní podobě', failures);
    }
}

// Features turned off or failed. The CSS of the extension applies as soon as the page shows, before the features run,
// so a feature replacing a part of the site can hide it there from the start, so it does not blink, by a rule for when
// the feature is not marked off: `:root:not([data-cvvz-off~="site/watchdog"]) .sticky-side-block { display: none; }`
function markFeaturesOff(ids) {
    document.documentElement.dataset.cvvzOff = ids.join(' ');
}

runFeatures();
