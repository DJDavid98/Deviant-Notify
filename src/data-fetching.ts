import { OptionsManager } from './classes/options-manager.js';
import { ReadStateManager } from './classes/read-state-manager.js';
import {
  CookieObject,
  DiFiCall,
  DiFiCallRequest,
  DiFiNotesFolder,
  DifiNotesList,
  DiFiResponse,
  ExtensionScope,
  FeedbackMessageCounts,
  FeedbackMessageTypes,
  WatchMessageCounts,
  WatchMessageTypes,
} from './common-types.js';
import {
  COOKIE_URL,
  DEFAULT_MESSAGE_COUNTS,
  DEFAULT_READ_AT_TIMESTAMP,
  isFirefox,
  LINKS,
  MAX_NEW_COUNTS,
  VALID_FEEDBACK_MESSAGE_TYPES,
  VALID_WATCH_MESSAGE_TYPES,
} from './common.js';
import { ExtensionAction } from './extension-action.js';
import { CombinedMessageCenterResponses, combineMessageCenterApiRequests, RequestUtils } from './request-utils.js';
import { executeAction, isValidDate, parseHtml } from './utils.js';

export function request(path: string, params: RequestInit = {}): Promise<Response> {
  return fetch(COOKIE_URL + path.substr(1), {
    ...params,
    credentials: 'include',
  });
}

export function getCookieByName(name: string): Promise<CookieObject | null | undefined> {
  return new Promise<CookieObject>((res) => {
    const getObject = {
      name,
      url: COOKIE_URL,
    };
    const handleCookie = (existingCookie: unknown) => {
      res(existingCookie as CookieObject);
    };
    if (isFirefox) {
      browser.cookies.get(getObject).then(handleCookie);
    } else {
      chrome.cookies.get(getObject, handleCookie);
    }
  });
}

/**
 * Retrieve the number of non-dismissed items in the feedback notifications feed
 */
async function getFeedbackCount(
  defaultCounts: FeedbackMessageCounts,
  options: OptionsManager,
  read: ReadStateManager,
): Promise<CombinedMessageCenterResponses<FeedbackMessageTypes>> {
  const disabledTypes = options.get('feedbackDisabled');
  let messageTypes: string[] = [...VALID_FEEDBACK_MESSAGE_TYPES];
  if (Array.isArray(disabledTypes) && disabledTypes.length > 0) {
    // Shortcut to return 0 if all types are disabled
    if (disabledTypes.length === VALID_FEEDBACK_MESSAGE_TYPES.length) {
      return [defaultCounts, undefined];
    }

    // Get count for enabled message types
    messageTypes = messageTypes.filter((type) => !disabledTypes.includes(type));
  }
  const limit = MAX_NEW_COUNTS.notifications + 1;
  const paths = messageTypes.map((type) => `${LINKS.feedbackApi}?limit=${limit}&messagetype=${type}&stacked=false`);
  const [total, newCount] = await combineMessageCenterApiRequests(read, 'feedback', paths);
  return [
    {
      ...defaultCounts,
      ...total,
    },
    newCount,
  ];
}

/**
 * Retrieve the number of unread notes via a folder listing
 */
async function getMessageCount(reqUtils: RequestUtils, read: ReadStateManager): Promise<[number, number]> {
  let unreadOffset = 0;
  const getUnreadFolderParams = (): DiFiCallRequest => ({
    class: 'Notes',
    method: 'display_folder',
    args: ['unread', String(unreadOffset), true],
  });

  let totalCount = 0;
  let newNoteCount = 0;
  const data = reqUtils.buildNewRequestParams([
    {
      class: 'DeveloperConsole',
      method: 'do_api_request',
      args: ['/notes/folders', []],
    },
    getUnreadFolderParams(),
  ]);

  const result: DiFiResponse<[
    DiFiCall<{ results: DiFiNotesFolder[] }>,
    DiFiCall<DifiNotesList>
  ]> = await request(LINKS.difi, { method: 'POST', body: data }).then((r) => r.json());

  const { content: totalContent, status: totalStatus } = result.DiFi.response.calls[0].response;

  if (totalStatus !== 'SUCCESS') {
    console.error('Failed to fetch note counts');
    return [totalCount, newNoteCount];
  }

  const folders = (totalContent as { results: DiFiNotesFolder[] }).results;
  if (Array.isArray(folders)) {
    const unreadFolder = folders.find((folder) => folder.title === 'Unread');
    if (unreadFolder) {
      totalCount = parseInt(unreadFolder.count, 10);
    }
  }

  const notesLastRead = read.get('messages');
  const notesLastReadTime = notesLastRead ? notesLastRead.getTime() : DEFAULT_READ_AT_TIMESTAMP;

  const getNextNotes = async () => {
    const newData = reqUtils.buildNewRequestParams(getUnreadFolderParams());

    const newResult: DiFiResponse<[DiFiCall<DifiNotesList>]> = await request(LINKS.difi, {
      method: 'POST',
      body: newData,
    })
      .then((r) => r.json());

    return newResult.DiFi.response.calls[0].response;
  };

  const processNotesFolderResponse = async (response: DiFiCall<DifiNotesList>['response']) => {
    const { content, status } = response;

    if (status !== 'SUCCESS') return;

    const $content = parseHtml(content.body);
    const $unreadNotes = $content.querySelectorAll('.note.unread');
    const hasMore = $content.querySelector('.pages .next:not(.disabled)') !== null;
    unreadOffset = content.offset + $unreadNotes.length;

    $unreadNotes.forEach(($note) => {
      const $timestamp = $note.querySelector('.ts');
      if ($timestamp) {
        const titleAttr = $timestamp.getAttribute('title');
        if (titleAttr) {
          const noteDate = new Date(titleAttr);
          if (isValidDate(noteDate)) {
            /**
             * The timestamps on the notes appears to be in PDT, so we need to subtract the user's timezone offset
             * and add PDT's to get an accurate timestamp
             */
            const pdtAdjustedTimestamp = noteDate.getTime() - (noteDate.getTimezoneOffset() * 60e3) + (7 * 36e5);
            const timeSinceLastRead = pdtAdjustedTimestamp - notesLastReadTime;
            if (timeSinceLastRead > 0) {
              newNoteCount++;
            }
          }
        }
      }
    });

    if (hasMore) {
      if (newNoteCount < MAX_NEW_COUNTS.notes) {
        const nextPage = await getNextNotes();
        await processNotesFolderResponse(nextPage);
        return;
      }

      newNoteCount = MAX_NEW_COUNTS.notes + 1;
    }
  };

  await processNotesFolderResponse(result.DiFi.response.calls[1].response);

  return [totalCount, newNoteCount];
}

/**
 * Retrieve the number of non-dismissed items in the watch notifications feed
 */
async function getWatchCount(
  defaultCounts: WatchMessageCounts,
  options: OptionsManager,
  read: ReadStateManager,
): Promise<CombinedMessageCenterResponses<WatchMessageTypes>> {
  const disabledTypes = options.get('watchDisabled');
  let messageTypes = [...VALID_WATCH_MESSAGE_TYPES];
  if (Array.isArray(disabledTypes) && disabledTypes.length > 0) {
    // Shortcut to return 0 if all types are disabled
    if (disabledTypes.length === VALID_WATCH_MESSAGE_TYPES.length) {
      return [defaultCounts, undefined];
    }

    messageTypes = messageTypes.filter((type) => !disabledTypes.includes(type));
  }

  const limit = MAX_NEW_COUNTS.notifications + 1;
  const paths = messageTypes.map((type) => `${LINKS.watchApi}?limit=${limit}&messagetype=${type}&stacked=false`);
  const [total, newCount] = await combineMessageCenterApiRequests(read, 'watch', paths);
  return [
    {
      ...defaultCounts,
      ...total,
    },
    newCount,
  ];
}

export function checkSiteData(scope: ExtensionScope): void {
  if (scope.extension.getUpdating()) {
    // Skip this call if we're still updating
    return;
  }

  const requestPromise = request(LINKS.lightUrl)
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
        executeAction(ExtensionAction.BROADCAST_POPUP_UPDATE, scope.extension.getPopupData());
        return;
      }

      await scope.reqUtils.updateParams(resp);

      let feedbackCount: FeedbackMessageCounts | undefined;
      let newFeedbackCount: FeedbackMessageCounts | undefined;
      const defaultFeedbackCount: FeedbackMessageCounts = { ...DEFAULT_MESSAGE_COUNTS.feedback };
      const defaultNewFeedbackCount: FeedbackMessageCounts = { ...DEFAULT_MESSAGE_COUNTS.feedback };
      let messageCount = 0;
      let newMessageCount = 0;
      let watchCount: WatchMessageCounts | undefined;
      let newWatchCount: WatchMessageCounts | undefined;
      const defaultWatchCount: WatchMessageCounts = { ...DEFAULT_MESSAGE_COUNTS.watch };
      const defaultNewWatchCount: WatchMessageCounts = { ...DEFAULT_MESSAGE_COUNTS.watch };
      try {
        [
          [feedbackCount, newFeedbackCount],
          [messageCount, newMessageCount],
          [watchCount, newWatchCount],
        ] = await Promise.all([
          getFeedbackCount(defaultFeedbackCount, scope.options, scope.read),
          getMessageCount(scope.reqUtils, scope.read),
          getWatchCount(defaultWatchCount, scope.options, scope.read),
        ]);
      } catch (e) {
        console.error('Failed to get message counts', e);
      }

      scope.extension.setFeedbackCount(feedbackCount || defaultFeedbackCount);
      scope.extension.setNewFeedbackCount(newFeedbackCount || defaultNewFeedbackCount);
      scope.extension.setMessageCount(messageCount);
      scope.extension.setNewMessageCount(newMessageCount);
      scope.extension.setWatchCount(watchCount || defaultWatchCount);
      scope.extension.setNewWatchCount(newWatchCount || defaultNewWatchCount);
      scope.extension.updateBadgeCounter();
      scope.extension.setSignedIn(true);

      const $body = $page.querySelector('body');
      if ($body) {
        const bodyClass = $body.getAttribute('class');
        scope.extension.setAutoThemeFromBodyClasses(bodyClass);
      }
    })
    .catch((e) => console.error('checkSiteData caught error', e));

  scope.extension.setUpdating(requestPromise);
}
