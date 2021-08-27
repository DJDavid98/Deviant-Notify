import { OptionsManager } from './classes/options-manager.js';
import { ReadStateManager } from './classes/read-state-manager.js';
import {
  ApiConsoleResponse,
  CookieObject,
  ExtensionScope,
  FeedbackMessageCounts,
  FeedbackMessageTypes,
  NotesFolder,
  NotesListApiResponse,
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
import { CombinedMessageCenterResponses, combineMessageCenterApiRequests, requestApiConsole } from './request-utils.js';
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
    {
      ...newCount,
      ...disabledTypes.reduce((a, c) => ({ ...a, [c]: 0 }), {} as Record<FeedbackMessageTypes, number>),
    },
  ];
}

/**
 * Retrieve the number of unread notes via a folder listing
 */
async function getMessageCount(read: ReadStateManager): Promise<[number, number]> {
  let notesOffset = 0;
  let unreadFolderId = '';
  const getNextNotes = () => requestApiConsole<NotesListApiResponse>('/notes', [
    { name: 'folderid', value: unreadFolderId },
    { name: 'offset', value: String(notesOffset) },
    { name: 'limit', value: String(MAX_NEW_COUNTS.notes) },
  ]);

  let totalCount = 0;
  let newNoteCount = 0;

  try {
    const foldersListResponse = await requestApiConsole<ApiConsoleResponse<NotesFolder[]>>('/notes/folders');
    const folders = foldersListResponse.results;
    if (Array.isArray(folders)) {
      const unreadFolder = folders.find((folder) => folder.title === 'Unread');
      if (!unreadFolder) {
        throw new Error('No unread folder found');
      }
      unreadFolderId = unreadFolder.folder;
      totalCount = parseInt(unreadFolder.count, 10);
    }
  } catch (e) {
    console.error(e);
  }
  if (unreadFolderId === '') {
    console.error('Failed to fetch note folders');
    return [totalCount, newNoteCount];
  }

  const notesLastRead = read.get('messages');
  const notesLastReadTime = notesLastRead ? notesLastRead.getTime() : DEFAULT_READ_AT_TIMESTAMP;

  // eslint-disable-next-line camelcase
  const processNotesFolderResponse = async (response: NotesListApiResponse) => {
    const unreadNotes = response.results.filter((note) => note.unread);

    unreadNotes.forEach((note) => {
      const noteDate = new Date(note.ts);
      if (isValidDate(noteDate)) {
        const timeSinceLastRead = noteDate.getTime() - notesLastReadTime;
        if (timeSinceLastRead > 0) {
          newNoteCount++;
        }
      }
    });

    // eslint-disable-next-line camelcase
    if (response.has_more) {
      // eslint-disable-next-line camelcase
      notesOffset += response.next_offset;

      if (newNoteCount <= MAX_NEW_COUNTS.notes) {
        const nextPage = await getNextNotes();
        await processNotesFolderResponse(nextPage);
        return;
      }

      newNoteCount = MAX_NEW_COUNTS.notes + 1;
    }
  };

  const notesListResponse = await getNextNotes();
  await processNotesFolderResponse(notesListResponse);

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
    {
      ...newCount,
      ...disabledTypes.reduce((a, c) => ({ ...a, [c]: 0 }), {} as Record<WatchMessageTypes, number>),
    },
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
        await executeAction(ExtensionAction.BROADCAST_POPUP_UPDATE, scope.extension.getPopupData());
        return;
      }

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
          getMessageCount(scope.read),
          getWatchCount(defaultWatchCount, scope.options, scope.read),
        ]);
      } catch (e) {
        console.error('Failed to get message counts', e);
      }

      scope.extension.setFeedbackCount({ ...defaultFeedbackCount, ...feedbackCount });
      scope.extension.setNewFeedbackCount({ ...defaultNewFeedbackCount, ...newFeedbackCount });
      scope.extension.setMessageCount(messageCount);
      scope.extension.setNewMessageCount(newMessageCount);
      scope.extension.setWatchCount({ ...defaultWatchCount, ...watchCount });
      scope.extension.setNewWatchCount({ ...defaultNewWatchCount, ...newWatchCount });
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
