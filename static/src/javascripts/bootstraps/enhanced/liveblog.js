// @flow
import config from 'lib/config';
import { isBreakpoint } from 'lib/detect';
import mediator from 'lib/mediator';
import richLinks from 'common/modules/article/rich-links';
import Affix from 'common/modules/experiments/affix';
import { autoUpdate } from 'common/modules/ui/autoupdate';
import RelativeDates from 'common/modules/ui/relativedates';
import { init as initLiveblogCommon } from 'bootstraps/enhanced/article-liveblog-common';
import trail from 'bootstraps/enhanced/trail';
import { catchErrorsWithContext } from 'lib/robust';
import storyQuestions from 'common/modules/atoms/story-questions';

const affixTimeline = (): void => {
    if (
        isBreakpoint({
            min: 'desktop',
        }) &&
        !config.page.keywordIds.includes('football/football') &&
        !config.page.keywordIds.includes('sport/rugby-union')
    ) {
        // eslint-disable-next-line no-new
        new Affix({
            element: document.querySelector(
                '.js-live-blog__sticky-components-container'
            ),
            topMarker: document.querySelector('.js-top-marker'),
            bottomMarker: document.querySelector('.js-bottom-marker'),
            containerElement: document.querySelector(
                '.js-live-blog__sticky-components'
            ),
        });
    }
};

const createAutoUpdate = (): void => {
    if (config.page.isLive) {
        autoUpdate();
    }
};

const keepTimestampsCurrent = (): void => {
    const dates = RelativeDates;

    window.setInterval(() => {
        dates.init();
    }, 60000);
};

const initStoryquestions = (): void => {
    if (document.getElementsByClassName('js-ask-question-link').length) {
        storyQuestions.init();
    } else {
        mediator.once('modules:autoupdate:updates', initStoryquestions);
    }
};

const init = (): void => {
    catchErrorsWithContext([
        ['lb-autoupdate', createAutoUpdate],
        ['lb-timeline', affixTimeline],
        ['lb-timestamp', keepTimestampsCurrent],
        ['lb-richlinks', richLinks.upgradeRichLinks],
        ['lb-storyquestions', initStoryquestions],
    ]);

    trail();
    initLiveblogCommon();

    catchErrorsWithContext([
        [
            'lb-ready',
            () => {
                mediator.emit('page:liveblog:ready');
            },
        ],
    ]);
};

export { init };
