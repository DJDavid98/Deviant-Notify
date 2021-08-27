import {
  ExtensionOptions,
  ExtensionReadStates,
  FeedbackMessageTypes,
  TotalMessageCounts,
  TotalMessagesRecord,
  WatchMessageTypes,
} from './common-types.js';

export const isFirefox = 'browser' in window;
export const isMac = /(macos|iphone|os ?x|ip[ao]d|imac)/i.test(window.navigator.userAgent);
export const COOKIE_URL = 'https://www.deviantart.com/';
export const NOTIF_ID = 'Deviant-Notify';
export const LINKS = {
  lightUrl: '/about/policy/etiquette/',
  feedbackApi: '/_napi/da-messagecentre/api/feedback',
  watchApi: '/_napi/da-messagecentre/api/watch',
  consoleApiRequest: '/developers/console/do_api_request',
  notes: '/notifications/notes',
  feedback: '/notifications/feedback',
  watch: '/notifications/watch',
  signInPage: '/users/login',
} as const;
export const VALID_DOMAINS = (() => {
  const manifest = chrome.runtime.getManifest();
  // jshint -W106
  return (manifest.permissions || []).concat(manifest.optional_permissions || [])
    .filter((el) => /^http/.test(el))
    .map((el) => el.replace(/^https?:\/\/([^/]+)\/$/, '$1'));
})();
export const VALID_THEMES = ['dark', 'light', 'green', 'auto'] as const;
export const VALID_ICON_STYLES = {
  bell: ['black', 'white'],
  chat: ['black', 'white'],
  watch: ['black', 'white'],
} as const;
export const VALID_WATCH_MESSAGE_TYPES = [
  'deviations',
  'groupDeviations',
  'journals',
  'commissions',
  'forums',
  'misc',
  'polls',
  'status',
] as const;
export const VALID_FEEDBACK_MESSAGE_TYPES = [
  'comments',
  'replies',
  'mentions',
  'activity',
  'correspondence',
] as const;

export const DEFAULT_OPTIONS: Readonly<ExtensionOptions> = {
  badgeColor: '#3a4e27',
  preferredDomain: VALID_DOMAINS[0],
  theme: 'auto',
  updateInterval: 2,
  notifEnabled: true,
  notifSound: true,
  notifTimeout: 15,
  notifIcons: true,
  bellIconStyle: VALID_ICON_STYLES.bell[0],
  chatIconStyle: VALID_ICON_STYLES.chat[0],
  watchIconStyle: VALID_ICON_STYLES.watch[0],
  watchDisabled: [],
  feedbackDisabled: [],
  useSyncStorage: true,
};

export const WATCH_MESSAGE_TYPE_READABLE_NAMES: Record<WatchMessageTypes, string> = {
  deviations: 'Deviation',
  groupDeviations: 'Group Deviation',
  journals: 'Post',
  forums: 'Forum',
  polls: 'Poll',
  status: 'Status Update',
  commissions: 'Commission',
  misc: 'Miscellaneous',
};
export const FEEDBACK_MESSAGE_TYPE_READABLE_NAMES: Record<FeedbackMessageTypes, string> = {
  comments: 'Comment',
  replies: 'Reply',
  mentions: 'Mention',
  activity: 'Activity',
  correspondence: 'Correspondence',
};

/**
 * These are the maximum number of new items that will be displayed by the UI
 *
 * A `+` should be added after the unread count if it is greater than this value
 */
export const MAX_NEW_COUNTS = {
  notes: 50,
  notifications: 24,
} as const;

export const constructTotalMessagesRecord = <T>(defaultValue: T): TotalMessagesRecord<T> => ({
  feedback: {
    activity: defaultValue,
    comments: defaultValue,
    correspondence: defaultValue,
    mentions: defaultValue,
    replies: defaultValue,
  },
  messages: defaultValue,
  watch: {
    commissions: defaultValue,
    deviations: defaultValue,
    forums: defaultValue,
    groupDeviations: defaultValue,
    journals: defaultValue,
    misc: defaultValue,
    polls: defaultValue,
    status: defaultValue,
  },
});
export const DEFAULT_MESSAGE_COUNTS: TotalMessageCounts = constructTotalMessagesRecord(0);
export const DEFAULT_READ_STATE: ExtensionReadStates = constructTotalMessagesRecord(null);

/**
 * Represents the unix epoch in milliseconds, used for checking last read time against some arbitrary old date
 */
export const DEFAULT_READ_AT_TIMESTAMP = 0;
