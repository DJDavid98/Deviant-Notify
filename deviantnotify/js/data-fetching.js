import { COOKIE_URL, isFirefox, LINKS, VALID_WATCH_MESSAGE_TYPES } from './common.js';
import { parseHtml } from './utils.js';

/**
 * @param {string} path
 * @param {RequestInit} params
 * @return {Promise<Response>}
 */
export function request(path, params = {}) {
  const requestParams = {
    ...params,
    credentials: 'include',
  };
  return fetch(COOKIE_URL + path.substr(1), requestParams);
}

/**
 * @param {string} name
 * @return {Promise<{
 *   domain: string,
 *   expirationDate: number,
 *   firstPartyDomain: string,
 *   hostOnly: boolean,
 *   httpOnly: boolean,
 *   name: string,
 *   path: string,
 *   sameSite: string,
 *   secure: boolean,
 *   session: boolean,
 *   storeId: string,
 *   value: string,
 * }>}
 */
export function getCookieByName(name) {
  return new Promise((res) => {
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
 * @typedef FeedbackApiResponse
 * @property {{ total: number }} counts
 */

/**
 * @param {FeedbackApiResponse} resp
 * @return {number}
 */
function getTotalFromFeedbackApiResponse(resp) {
  if (typeof resp === 'object') {
    if (typeof resp.counts === 'object') {
      if (typeof resp.counts.total === 'number') {
        return resp.counts.total;
      }
    }
  }

  return 0;
}

/**
 * Retrieve the number of non-dismissed items in the watch notifications feed
 * @return {Promise<number>}
 */
async function getNotificationCount() {
  const path = `${LINKS.feedbackApi}?limit=0`;

  /** @type {FeedbackApiResponse} */
  const resp = await request(path, { redirect: 'error' })
    .then((r) => r.json())
    .catch((e) => {
      console.error('Failed to retrieve notification count, see the error below');
      console.error(e);
    });

  return getTotalFromFeedbackApiResponse(resp);
}

/**
 * Retrieve the number of unread notes via a folder listing
 * @param {RequestUtils} reqUtils
 * @return {Promise<number>}
 */
async function getMessageCount(reqUtils) {
  const data = reqUtils.buildNewRequestParams({
    class: 'DeveloperConsole',
    method: 'do_api_request',
    args: ['/notes/folders', []],
  });
  /** @type {DiFiResponse} */
  const result = await request(LINKS.difi, {
    method: 'POST',
    body: data,
  })
    .then((r) => r.json());

  const { results: folders } = result.DiFi.response.calls[0].response.content;

  if (Array.isArray(folders)) {
    const unreadFolder = folders.find((folder) => folder.title === 'Unread');
    if (unreadFolder) {
      return parseInt(unreadFolder.count, 10);
    }
  }

  return 0;
}

/**
 * Retrieve the number of non-dismissed items in the watch notifications feed
 * @param {Options} options
 * @return {Promise<number>}
 */
async function getWatchCount(options) {
  const disabledTypes = options.get('watchDisabled');
  let messageTypes = [...VALID_WATCH_MESSAGE_TYPES];
  if (disabledTypes && messageTypes.length > 0) {
    messageTypes = messageTypes.filter((type) => !disabledTypes.includes(type));
  }

  /** @type {FeedbackApiResponse[]} */
  const responses = await Promise.all(messageTypes.map((type) => (
    request(`${LINKS.watchApi}?limit=0&messagetype=${type}&stacked=false`)
      .then((r) => r.json())
  )))
    .catch((e) => {
      console.error('Failed to retrieve watch count, see the error below');
      console.error(e);
    });

  return responses.reduce(
    (total, response) => total + getTotalFromFeedbackApiResponse(response),
    0,
  );
}

/**
 * @param {ExtensionScope} scope
 */
export function checkSiteData(scope) {
  request(LINKS.lightUrl)
    .catch((e) => console.error('checkSiteData caught error', e))
    .then((resp) => resp.text())
    .then(async (resp) => {
      scope.extension.setLastCheck(new Date());
      const $page = $(parseHtml(resp));

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

      let notifCount = 0;
      let messageCount = 0;
      let watchCount = 0;
      try {
        [notifCount, messageCount, watchCount] = await Promise.all([
          getNotificationCount(),
          getMessageCount(scope.reqUtils),
          getWatchCount(scope.options),
        ]);
      } catch (e) {
        console.error('Failed to get message counts', e);
      }

      // Placeholder
      scope.extension.setNotifCount(notifCount);
      scope.extension.setMessageCount(messageCount);
      scope.extension.setWatchCount(watchCount);
      scope.extension.updateBadgeCounter();
      scope.extension.setSignedIn(true);

      const bodyClass = $page.find('body').attr('class');
      scope.extension.setAutoThemeFromBodyClasses(bodyClass);
    });
}
