import { ErrorCollection } from '../classes/error-colection.js';
import { OptionsManager } from '../classes/options-manager.js';
import { ExtensionActionData, ExtensionActionResponses, OptionProcessingFailedResult } from '../common-types.js';
import { isFirefox, LINKS, NOTIF_ID } from '../common.js';
import { checkSiteData } from '../data-fetching.js';
import { ExtensionAction } from '../extension-action.js';
import { openMessagesPage, openNotificationsPage, openWatchPage } from '../page-openers.js';
import { makeURLFromPath } from '../request-utils.js';
import { singleton } from '../singleton.js';
import { secondsElapsedSince } from '../utils.js';

singleton.options.loadUserOptions()
  .then(() => {
    checkSiteData(singleton);
  })
  .catch((e) => {
    console.error('Options validation failed:', e);
  });

type MessageHandlers = {
  [k in ExtensionAction]: (param: {
    data: ExtensionActionData[k],
    resp: (responseData: ExtensionActionResponses[k]) => void,
  }) => boolean | void;
}

const HANDLERS: MessageHandlers = {
  [ExtensionAction.UPDATE_OPTIONS]: ({ data, resp }) => {
    singleton.options.processOptions(data)
      .then((results) => {
        const failed = results.filter((el): el is OptionProcessingFailedResult => el.status === false);
        if (failed.length) {
          const errors = new ErrorCollection();
          failed.forEach((el) => {
            errors.add(el.key, el.errors);
          });
          resp({
            status: false,
            errors: errors.getAll(),
          });
        } else {
          singleton.options.saveOptions(true);
          resp({ status: true });
        }
      });
    return true;
  },
  [ExtensionAction.GET_SELECTORS]: ({ resp }) => {
    resp({
      onlyDomain: singleton.options.get('preferredDomain'),
    });
  },
  [ExtensionAction.ON_SITE_UPDATE]: ({ data }) => {
    singleton.extension.setAutoThemeFromBodyClasses(data.bodyClass);

    // Always attempt to check again when not signed in on page load
    let immediateRecheck = !singleton.extension.getSignedIn();
    if (!immediateRecheck) {
      const lastCheck = singleton.extension.getLastCheck();
      immediateRecheck = secondsElapsedSince(lastCheck) > 30;
    }

    singleton.extension.restartUpdateInterval(immediateRecheck);
  },
  [ExtensionAction.TEST_MESSAGE]: ({ data }) => {
    const id = `${NOTIF_ID}-Test`;
    singleton.notifier.clearNotif(id)
      .then(() => {
        const prefs = new OptionsManager(singleton, data);
        const randomMax = 256;
        const unread = {
          notifs: Math.round(Math.random() * randomMax),
          messages: Math.round(Math.random() * randomMax),
          watch: 0,
        };
        singleton.notifier.show(unread, id, prefs);
      });
  },
  [ExtensionAction.GET_POPUP_DATA]: ({ resp }) => void resp(singleton.extension.getPopupData()),
  [ExtensionAction.GET_OPTIONS_DATA]: ({ resp }) => void resp(singleton.extension.getOptionsData()),
  [ExtensionAction.OPEN_NOTIFS_PAGE]: () => void openNotificationsPage(),
  [ExtensionAction.OPEN_MESSAGES_PAGE]: () => void openMessagesPage(),
  [ExtensionAction.OPEN_WATCH_PAGE]: () => void openWatchPage(),
  [ExtensionAction.OPEN_SIGN_IN_PAGE]: () => {
    chrome.tabs.create({ url: makeURLFromPath(LINKS.signInPage, singleton.options) });
  },
};

// eslint-disable-next-line consistent-return
chrome.runtime.onMessage.addListener((req, sender, resp) => {
  const { action, data } = req;
  if (action in HANDLERS) {
    return HANDLERS[action]({ data, resp });
  }

  throw new Error(`No handler defined for action ${action}`);
});

chrome.notifications.onButtonClicked.addListener((notifId, btnIndex) => {
  const { notifs, messages, watch } = singleton.notifier.getButtonIndexes(notifId);
  switch (btnIndex) {
    case notifs:
      openNotificationsPage();
      break;
    case messages:
      openMessagesPage();
      break;
    case watch:
      openWatchPage();
      break;
  }
  chrome.notifications.clear(notifId);
});

// Set a click handler for Firefox notifications
if (isFirefox) {
  browser.notifications.onClicked.addListener((notifId) => {
    void singleton.notifier.clearNotif(notifId);
  });
}
