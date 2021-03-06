// @flow

import config from 'lib/config';
import mediator from 'lib/mediator';
import fetchJSON from 'lib/fetch-json';
import fastdom from 'lib/fastdom-promise';
import register from 'common/modules/analytics/register';
import Expandable from 'common/modules/ui/expandable';
import intersection from 'lodash/arrays/intersection';

const buildExpandable = (el: HTMLElement): void => {
    new Expandable({
        dom: el,
        expanded: false,
        showCount: false,
    }).init();
};

const popularInTagOverride = (): ?string | false => {
    /* whitelist of tags to override related story component with a
       popular-in-tag component */
    if (!config.page.keywordIds) {
        return false;
    }

    // order matters here (first match wins)
    const whitelistedTags = [
        // sport tags
        'sport/cricket',
        'sport/rugby-union',
        'sport/rugbyleague',
        'sport/formulaone',
        'sport/tennis',
        'sport/cycling',
        'sport/motorsports',
        'sport/golf',
        'sport/horse-racing',
        'sport/boxing',
        'sport/us-sport',
        'sport/australia-sport',

        // football tags
        'football/championsleague',
        'football/premierleague',
        'football/championship',
        'football/europeanfootball',
        'football/world-cup-2014',

        // football team tags
        'football/manchester-united',
        'football/chelsea',
        'football/arsenal',
        'football/manchestercity',
        'football/tottenham-hotspur',
        'football/liverpool',
    ];

    const pageTags = config.page.keywordIds.split(',');
    // if this is an advertisement feature, use the page's keyword (there'll only be one)
    const popularInTags = config.page.isPaidContent
        ? pageTags
        : intersection(whitelistedTags, pageTags);

    if (popularInTags.length) {
        return `/popular-in-tag/${popularInTags[0]}.json`;
    }
};

const related = (opts: Object): void => {
    let relatedUrl;
    let popularInTag;
    let componentName;

    if (config.page && config.page.hasStoryPackage) {
        const expandable =
            document.body && document.body.querySelector('.related-trails');

        if (expandable) {
            buildExpandable(expandable);
        }
    } else if (
        config.switches.relatedContent &&
        config.page.showRelatedContent
    ) {
        const container =
            document.body && document.body.querySelector('.js-related');

        if (container && !container.classList.contains('lazyloaded')) {
            popularInTag = popularInTagOverride();
            componentName = popularInTag
                ? 'related-popular-in-tag'
                : 'related-content';

            register.begin(componentName);
            container.setAttribute('data-component', componentName);
            relatedUrl = popularInTag || `/related/${config.page.pageId}.json`;
            const queryParams = opts.excludeTags.map(
                tag => `exclude-tag=${tag}`
            );

            if (opts.excludeTags && opts.excludeTags.length) {
                relatedUrl += `?${queryParams.join('&')}`;
            }

            fetchJSON(relatedUrl, { mode: 'cors' })
                .then(resp =>
                    fastdom.write(() => {
                        container.innerHTML = resp.html;
                        container.classList.add('lazyloaded');
                    })
                )
                .then(() => {
                    const relatedContainer = container.querySelector(
                        '.related-content'
                    );

                    if (relatedContainer) {
                        buildExpandable(relatedContainer);
                    }

                    // upgrade images
                    mediator.emit('modules:related:loaded', container);
                    mediator.emit('page:new-content', container);
                    mediator.emit('ui:images:upgradePictures', container);
                    register.end(componentName);
                })
                .catch(() => {
                    container.remove();
                    register.error(componentName);
                });
        }
    } else {
        [...document.querySelectorAll('.js-related')].forEach(el =>
            el.classList.add('u-h')
        );
    }
};

export { related };
