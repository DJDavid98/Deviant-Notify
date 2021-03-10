import { isFirefox, LINKS, NOTIF_ID } from '../common.js';
import { ErrorCollection } from '../error-colection.class.js';
import { Options } from '../options.class.js';
import { singleton } from '../singleton.js';
import { makeURLFromPath } from '../request-utils.js';
import { checkSiteData } from '../data-fetching.js';
import { openMessagesPage, openNotificationsPage, openWatchPage } from '../page-openers.js';

singleton.options.loadUserOptions()
  .then(() => {
    checkSiteData(singleton);
  })
  .catch((e) => {
    console.error('Validation options failed:', e);
  });

// eslint-disable-next-line consistent-return
chrome.runtime.onMessage.addListener((req, sender, resp) => {
  switch (req.action) {
    case 'updateOptions':
      singleton.options.processOptions(req.data)
        .then((results) => {
          const failed = results.filter((el) => !el.status);
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
    case 'openSignInPage':
      chrome.tabs.create({ url: makeURLFromPath(LINKS.signInPage, singleton.options) });
      break;
    case 'getSelectors':
      resp({
        onlyDomain: singleton.options.get('preferredDomain'),
      });
      break;
    case 'onSiteUpdate': {
      singleton.extension.setAutoThemeFromBodyClasses(req.data.bodyClass);

      // Always attempt to check again on page load if not signed in
      let immediateRecheck = !singleton.extension.getSignedIn();
      if (!immediateRecheck) {
        const lastCheck = singleton.extension.getLastCheck();
        // Check for new notifications & notes again if last check was over 30s ago
        immediateRecheck = lastCheck instanceof Date && Date.now() - lastCheck.getTime() > 30e3;
      }

      singleton.extension.restartUpdateInterval(immediateRecheck);
    }
      break;
    case 'testMessage': {
      const id = `${NOTIF_ID}-Test`;
      singleton.notifier.clearNotif(id)
        .then(() => {
          const prefs = new Options(singleton, req.data);
          const randomMax = 256;
          const unread = {
            notifs: Math.round(Math.random() * randomMax),
            messages: Math.round(Math.random() * randomMax),
            watch: Math.round(Math.random() * randomMax),
          };
          singleton.notifier.show(unread, id, prefs);
        });
    }
      break;
    case 'getPopupData':
      resp(singleton.extension.getPopupData());
      break;
    case 'getOptionsData':
      resp(singleton.extension.getOptionsData());
      break;
    case 'openNotifsPage':
      openNotificationsPage();
      break;
    case 'openMessagesPage':
      openMessagesPage();
      break;
    case 'openWatchPage':
      openWatchPage();
      break;
    default:
      throw new Error(`No handler defined for action ${req.action}`);
  }
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
    singleton.notifier.clearNotif(notifId);
  });
}
