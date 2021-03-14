import { COOKIE_URL, isFirefox, LINKS, VALID_WATCH_MESSAGE_TYPES } from './common.js';
import {
  CookieObject,
  DiFiNotesFolder,
  DiFiResponse,
  ExtensionScope,
  FeedbackApiResponse,
} from './common-types.js';
import { OptionsManager } from './classes/options-manager.js';
import { RequestUtils } from './request-utils.js';
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

function getTotalFromFeedbackApiResponse(resp: FeedbackApiResponse): number {
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
 */
async function getNotificationCount(): Promise<number> {
  const path = `${LINKS.feedbackApi}?limit=0`;

  const resp: FeedbackApiResponse = await request(path, { redirect: 'error' })
    .then((r) => r.json())
    .catch((e) => {
      console.error('Failed to retrieve notification count, see the error below');
      console.error(e);
    });

  return getTotalFromFeedbackApiResponse(resp);
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
  if (disabledTypes && disabledTypes.length > 0) {
    messageTypes = messageTypes.filter((type) => !disabledTypes.includes(type));
  }

  const responses = await Promise.all<FeedbackApiResponse>(messageTypes.map((type) => (
    request(`${LINKS.watchApi}?limit=0&messagetype=${type}&stacked=false`)
      .then((r) => r.json())
  )))
    .catch((e) => {
      console.error('Failed to retrieve watch count, see the error below');
      console.error(e);
    });

  if (!Array.isArray(responses)) return 0;

  return responses.reduce(
    (total, response) => total + getTotalFromFeedbackApiResponse(response),
    0,
  );
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

      const bodyClass = $page.querySelector('body').getAttribute('class');
      scope.extension.setAutoThemeFromBodyClasses(bodyClass);
    })
    .catch((e) => console.error('checkSiteData caught error', e));
}
