export const isFirefox = 'browser' in window;
export const COOKIE_URL = 'https://www.deviantart.com/';
export const NOTIF_ID = 'Deviant-Notify';
export const LINKS = {
  lightUrl: '/about/policy/etiquette/',
  feedbackApi: '/_napi/da-messagecentre/api/feedback',
  difi: '/global/difi/',
  messages: '/notifications/notes',
  notifs: '/notifications/feedback',
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
};

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
 */

/**
 * @type {ExtensionOptions}
 */
export const DEFAULT_OPTIONS = {
  badgeColor: '#3a4e27',
  preferredDomain: VALID_DOMAINS[0],
  theme: 'auto',
  updateInterval: 1,
  notifEnabled: true,
  notifSound: true,
  notifTimeout: 0,
  notifIcons: true,
  bellIconStyle: VALID_ICON_STYLES.bell[0],
  chatIconStyle: VALID_ICON_STYLES.chat[0],
};
