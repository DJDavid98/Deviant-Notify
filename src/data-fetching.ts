import { OptionsManager } from './classes/options-manager.js';
import { CookieObject, DiFiNotesFolder, DiFiResponse, ExtensionScope } from './common-types.js';
import {
  COOKIE_URL,
  isFirefox,
  LINKS,
  VALID_FEEDBACK_MESSAGE_TYPES,
  VALID_WATCH_MESSAGE_TYPES,
} from './common.js';
import { combineMessageCenterApiRequests, RequestUtils } from './request-utils.js';
import { parseHtml } from './utils.js';

export function request(path: string, params: RequestInit = {}): Promise<Response> {
  return fetch(COOKIE_URL + path.substr(1), {
    ...params,
    credentials: 'include',
  });
}

export function getCookieByName(name: string): Promise<CookieObject> {
  return new Promise<CookieObject>((res) => {
    const getObject = {
      name,
      url: COOKIE_URL,
    };
    const handleCookie = (existingCookie) => {
      res(existingCookie);
    };
    if (isFirefox) {
      browser.cookies.get(getObject)
        .then(handleCookie);
    } else {
      chrome.cookies.get(getObject, handleCookie);
    }
  });
}

/**
 * Retrieve the number of non-dismissed items in the watch notifications feed
 */
async function getFeedbackCount(options: OptionsManager): Promise<number> {
  const disabledTypes = options.get('feedbackDisabled');
  if (Array.isArray(disabledTypes) && disabledTypes.length > 0) {
    // Shortcut to return 0 if all types are disabled
    if (disabledTypes.length === VALID_FEEDBACK_MESSAGE_TYPES.length) {
      return 0;
    }

    // Get count for enabled message types
    const messageTypes = [...VALID_FEEDBACK_MESSAGE_TYPES].filter((type) => !disabledTypes.includes(type));
    const paths = messageTypes.map((type) => `${LINKS.feedbackApi}?limit=0&messagetype=${type}&stacked=false`);
    return combineMessageCenterApiRequests(paths);
  }

  // Get count for all types (no messagetype parameter)
  const path = `${LINKS.feedbackApi}?limit=0&stacked=false`;
  return combineMessageCenterApiRequests([path]);
}

/**
 * Retrieve the number of unread notes via a folder listing
 */
async function getMessageCount(reqUtils: RequestUtils): Promise<number> {
  const data = reqUtils.buildNewRequestParams({
    class: 'DeveloperConsole',
    method: 'do_api_request',
    args: ['/notes/folders', []],
  });

  const result: DiFiResponse = await request(LINKS.difi, {
    method: 'POST',
    body: data,
  })
    .then((r) => r.json());

  const { content, status } = result.DiFi.response.calls[0].response;

  if (status === 'SUCCESS') {
    const folders = (content as { results: DiFiNotesFolder[] }).results;
    if (Array.isArray(folders)) {
      const unreadFolder = folders.find((folder) => folder.title === 'Unread');
      if (unreadFolder) {
        return parseInt(unreadFolder.count, 10);
      }
    }
  }

  return 0;
}

/**
 * Retrieve the number of non-dismissed items in the watch notifications feed
 */
async function getWatchCount(options: OptionsManager): Promise<number> {
  const disabledTypes = options.get('watchDisabled');
  let messageTypes = [...VALID_WATCH_MESSAGE_TYPES];
  if (Array.isArray(disabledTypes) && disabledTypes.length > 0) {
    // Shortcut to return 0 if all types are disabled
    if (disabledTypes.length === VALID_WATCH_MESSAGE_TYPES.length) {
      return 0;
    }

    messageTypes = messageTypes.filter((type) => !disabledTypes.includes(type));
  }

  const paths = messageTypes.map((type) => `${LINKS.watchApi}?limit=0&messagetype=${type}&stacked=false`);
  return combineMessageCenterApiRequests(paths);
}

export function checkSiteData(scope: ExtensionScope): void {
  request(LINKS.lightUrl)
    .then((resp) => resp.text())
    .then(async (resp) => {
      scope.extension.setLastCheck(new Date());
      const $page = parseHtml(resp);

      const uiCookie = await getCookieByName('userinfo');
      let signedIn = false;
      if (uiCookie && uiCookie.value) {
        const userInfo = JSON.parse(decodeURIComponent(uiCookie.value)
          .replace(/^__[^;]+;/, ''));
        if (userInfo.username) {
          scope.extension.setUsername(userInfo.username);
          signedIn = true;
        }
      }

      if (!signedIn) {
        scope.extension.setSignedIn(false);
        return;
      }

      await scope.reqUtils.updateParams(resp);

      let feedbackCount = 0;
      let messageCount = 0;
      let watchCount = 0;
      try {
        [feedbackCount, messageCount, watchCount] = await Promise.all([
          getFeedbackCount(scope.options),
          getMessageCount(scope.reqUtils),
          getWatchCount(scope.options),
        ]);
      } catch (e) {
        console.error('Failed to get message counts', e);
      }

      // Placeholder
      scope.extension.setFeedbackCount(feedbackCount);
      scope.extension.setMessageCount(messageCount);
      scope.extension.setWatchCount(watchCount);
      scope.extension.updateBadgeCounter();
      scope.extension.setSignedIn(true);

      const bodyClass = $page.querySelector('body').getAttribute('class');
      scope.extension.setAutoThemeFromBodyClasses(bodyClass);
    })
    .catch((e) => console.error('checkSiteData caught error', e));
}
