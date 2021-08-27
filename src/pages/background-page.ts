import { ErrorCollection } from '../classes/error-colection.js';
import { OptionsManager } from '../classes/options-manager.js';
import { MessageHandlers, OptionProcessingFailedResult, TotalMessageCounts } from '../common-types.js';
import {
  DEFAULT_MESSAGE_COUNTS,
  isFirefox,
  LINKS,
  MAX_NEW_COUNTS,
  NOTIF_ID,
} from '../common.js';
import { checkSiteData } from '../data-fetching.js';
import { ExtensionAction } from '../extension-action.js';
import { openFeedbackNotifsPage, openNotesPage, openWatchNotifsPage } from '../page-openers.js';
import { makeURLFromPath } from '../request-utils.js';
import { singleton } from '../singleton.js';
import { markAllNotifsRead, secondsElapsedSince } from '../utils.js';

singleton.read.load();
singleton.options.loadUserOptions()
  .then(() => {
    checkSiteData(singleton);
  })
  .catch((e) => {
    console.error('Options validation failed:', e);
  });

const noop = () => undefined;

const HANDLERS: MessageHandlers = {
  [ExtensionAction.UPDATE_OPTIONS]({ data, resp }) {
    singleton.options.processOptions(data)
      .then((results) => {
        const failed = results.filter((el): el is OptionProcessingFailedResult => !el.status);
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
  [ExtensionAction.GET_SELECTORS]({ resp }) {
    resp({
      onlyDomain: singleton.options.get('preferredDomain'),
    });
  },
  [ExtensionAction.ON_SITE_UPDATE]({ data }) {
    singleton.extension.setAutoThemeFromBodyClasses(data.bodyClass);

    // Always attempt to check again when not signed in on page load
    let immediateRecheck = !singleton.extension.getSignedIn();
    if (!immediateRecheck) {
      const lastCheck = singleton.extension.getLastCheck();
      immediateRecheck = secondsElapsedSince(lastCheck) > 30;
    }

    singleton.extension.restartUpdateInterval(immediateRecheck);
  },
  [ExtensionAction.TEST_MESSAGE]({ data }) {
    const id = `${NOTIF_ID}-Test`;
    singleton.notifier.clearNotif(id)
      .then(() => {
        const prefs = new OptionsManager(singleton, data);
        const counts: TotalMessageCounts = {
          feedback: {
            ...DEFAULT_MESSAGE_COUNTS.feedback,
            comments: Math.round(Math.random() * MAX_NEW_COUNTS.notifications),
          },
          messages: Math.round(Math.random() * MAX_NEW_COUNTS.notes),
          watch: { ...DEFAULT_MESSAGE_COUNTS.watch },
        };
        singleton.notifier.show(counts, id, prefs);
      });
  },
  [ExtensionAction.SET_MARK_READ]({ data }) {
    void singleton.read.update(data);
  },
  [ExtensionAction.CLEAR_MARK_READ]() {
    void singleton.read.clear();
  },
  [ExtensionAction.GET_POPUP_DATA]({ resp }) {
    resp(singleton.extension.getPopupData());
  },
  [ExtensionAction.GET_OPTIONS_DATA]({ resp }) {
    resp(singleton.extension.getOptionsData());
  },
  [ExtensionAction.INSTANT_UPDATE]() {
    singleton.extension.restartUpdateInterval(true);
  },
  [ExtensionAction.OPEN_NOTIFS_PAGE]() {
    openFeedbackNotifsPage();
  },
  [ExtensionAction.OPEN_MESSAGES_PAGE]() {
    openNotesPage();
  },
  [ExtensionAction.OPEN_WATCH_PAGE]() {
    openWatchNotifsPage();
  },
  [ExtensionAction.OPEN_SIGN_IN_PAGE]() {
    chrome.tabs.create({ url: makeURLFromPath(LINKS.signInPage, singleton.options) });
  },
  [ExtensionAction.BROADCAST_POPUP_UPDATE]: noop,
};

chrome.runtime.onMessage.addListener((req, sender, resp) => {
  const { action, data } = req;
  if (action in HANDLERS) {
    // eslint-disable-next-line consistent-return
    return HANDLERS[action as keyof MessageHandlers]({ data, resp });
  }

  throw new Error(`[Background] No handler defined for action ${action}`);
});

chrome.notifications.onButtonClicked.addListener((notifId, btnIndex) => {
  const { feedback, messages, watch, read } = singleton.notifier.getButtonIndexes(notifId);
  switch (btnIndex) {
    case feedback:
      openFeedbackNotifsPage();
      break;
    case messages:
      openNotesPage();
      break;
    case watch:
      openWatchNotifsPage();
      break;
    case read:
      markAllNotifsRead();
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
