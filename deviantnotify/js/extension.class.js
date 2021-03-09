import { NOTIF_ID, VALID_DOMAINS, VALID_ICON_STYLES, VALID_THEMES } from './common.js';
import { shortenCount } from './utils.js';
import { checkSiteData } from './data-fetching.js';

/**
 * @typedef UnreadCounts
 * @property {number} notifs
 * @property {number} messages
 * @property {number} [watch] TODO Implement
 */

const UNKNOWN_BADGE_TEXT = '?';

export class Extension {
  /**
   * @param {ExtensionScope} scope
   */
  constructor(scope) {
    /**
     * @type {ExtensionScope}
     * @private
     */
    this.scope = scope;
    /**
     * @type {UnreadCounts}
     * @private
     */
    this.unread = {
      notifs: 0,
      messages: 0,
    };
    /**
     * @type {{signedIn: boolean, autoTheme: string, username: string}}
     * @private
     */
    this.meta = {
      signedIn: false,
      username: '',
      autoTheme: VALID_THEMES[0],
    };
  }

  /**
   * @param {number|string} count
   */
  setNotifs(count) {
    this.unread.notifs = count === '' ? 0 : parseInt(count, 10);
  }

  /**
   * @param {number|string} count
   */
  setMessages(count) {
    this.unread.messages = count === '' ? 0 : parseInt(count, 10);
  }

  /**
   * @param {boolean} signedIn
   */
  setSignedIn(signedIn) {
    this.meta.signedIn = signedIn;

    if (this.meta.signedIn) {
      this.setBadgeSignedIn();
    } else {
      Extension.setBadgeSignedOut();
    }
  }

  /**
   * @return {boolean}
   */
  getSignedIn() {
    return this.meta.signedIn;
  }

  /**
   * @param {string} [username]
   */
  setUsername(username) {
    this.meta.username = username || '';
  }

  /**
   * @param {string} themeName
   */
  setAutoTheme(themeName) {
    this.meta.autoTheme = themeName;
  }

  /**
   * @param {Date} date
   */
  setLastCheck(date) {
    this.meta.lastCheck = date;
  }

  /**
   * @return {Date}
   */
  getLastCheck() {
    return this.meta.lastCheck;
  }

  setAutoThemeFromBodyClasses(bodyClass) {
    let newValue = VALID_THEMES[0];
    if (bodyClass.includes('light-green')) {
      newValue = 'green';
    } else {
      const mainThemeMatch = bodyClass.match(/theme-(light|dark)/);
      if (mainThemeMatch !== null) {
        [, newValue] = mainThemeMatch;
      }
    }
    this.setAutoTheme(newValue);
  }

  getPopupData() {
    return {
      notifs: this.unread.notifs,
      messages: this.unread.messages,
      signedIn: this.meta.signedIn,
      username: this.meta.username,
      version: chrome.runtime.getManifest().version,
      prefs: this.scope.options.getAll(),
      theme: this.getTheme(),
    };
  }

  getOptionsData() {
    return {
      prefs: this.scope.options.getAll(),
      version: chrome.runtime.getManifest().version,
      theme: this.getTheme(),
      validDomains: VALID_DOMAINS,
      validThemes: VALID_THEMES,
      validIconStyles: VALID_ICON_STYLES,
    };
  }

  getTheme(prefs = this.scope.options) {
    const setting = prefs.get('theme');
    if (setting === 'auto') {
      if (this.meta.autoTheme) return this.meta.autoTheme;
      throw new Error('Auto theme value not found');
    }

    return setting;
  }

  /**
   * Updates the count on the extension icon and sends a notification if it increased
   */
  updateBadgeCounter() {
    const value = this.unread.notifs + this.unread.messages;
    const newText = value === 0 ? '' : shortenCount(value);
    chrome.browserAction.getBadgeText({}, (currentText) => {
      if (currentText === newText) return;

      chrome.browserAction.setBadgeText({ text: newText });

      if (value === 0 || (!Number.isNaN(currentText) && currentText > newText)) return;

      this.scope.notifier.show(this.unread, NOTIF_ID);
    });
  }

  static setBadgeSignedOut() {
    chrome.browserAction.setBadgeBackgroundColor({ color: '#222' });
    chrome.browserAction.setBadgeText({ text: UNKNOWN_BADGE_TEXT });
  }

  setBadgeSignedIn() {
    const color = this.scope.options.get('badgeColor');
    if (color) chrome.browserAction.setBadgeBackgroundColor({ color });
  }

  setBadgeColor() {
    chrome.browserAction.getBadgeText({}, (ret) => {
      if (ret === UNKNOWN_BADGE_TEXT) return;

      this.setBadgeSignedIn();
    });
  }

  /**
   * @param {boolean} immediateRecheck
   */
  restartUpdateInterval(immediateRecheck = true) {
    if (typeof this.updateInterval !== 'undefined') clearInterval(this.updateInterval);
    this.updateInterval = setInterval(() => checkSiteData(this.scope), this.scope.options.get('updateInterval') * 60e3);
    if (immediateRecheck) checkSiteData(this.scope);
  }
}
