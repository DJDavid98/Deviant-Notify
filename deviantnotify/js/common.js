export const isFirefox = 'browser' in window;
export const COOKIE_URL = 'https://www.deviantart.com/';
export const NOTIF_ID = 'Deviant-Notify';
export const LINKS = {
  lightUrl: '/about/policy/etiquette/',
  feedbackApi: '/_napi/da-messagecentre/api/feedback',
  watchApi: '/_napi/da-messagecentre/api/watch',
  difi: '/global/difi/',
  messages: '/notifications/notes',
  notifs: '/notifications/feedback',
  watch: '/notifications/watch',
  signInPage: '/users/login',
};
export const VALID_DOMAINS = (() => {
  const manifest = chrome.runtime.getManifest();
  // jshint -W106
  return manifest.permissions.concat(manifest.optional_permissions)
    .filter((el) => /^http/.test(el))
    .map((el) => el.replace(/^https?:\/\/([^/]+)\/$/, '$1'));
})();
export const VALID_THEMES = ['dark', 'light', 'green', 'auto'];
export const VALID_ICON_STYLES = {
  bell: ['black', 'white'],
  chat: ['black', 'white'],
  watch: ['black', 'white'],
};
export const VALID_WATCH_MESSAGE_TYPES = [
  'deviations',
  'groupDeviations',
  'journals',
  'forums',
  'polls',
  'status',
  'commissions',
  'misc',
];

/**
 * @typedef ExtensionOptions
 * @property {string} badgeColor
 * @property {number} updateInterval
 * @property {boolean} notifEnabled
 * @property {number} notifTimeout
 * @property {string} preferredDomain
 * @property {boolean} notifIcons
 * @property {string} theme
 * @property {boolean} notifSound
 * @property {string} bellIconStyle
 * @property {string} chatIconStyle
 * @property {string} watchIconStyle
 * @property {string[]} watchDisabled
 */

/**
 * @type {ExtensionOptions}
 */
export const DEFAULT_OPTIONS = {
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
};
