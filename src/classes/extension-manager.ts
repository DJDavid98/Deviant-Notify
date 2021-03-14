import {
  ExtensionOptions,
  ExtensionScope,
  OptionsData,
  PopupData,
  ThemeName,
  UnreadCounts,
} from '../common-types.js';
import { NOTIF_ID, VALID_THEMES } from '../common.js';
import { checkSiteData } from '../data-fetching.js';
import { normalizeNumeric, shortenCount } from '../utils.js';

const UNKNOWN_BADGE_TEXT = '?';

export class ExtensionManager {
  private unread: UnreadCounts = {
    feedback: 0,
    messages: 0,
    watch: 0,
  };

  private meta: { signedIn: boolean; autoTheme: string; username: string; lastCheck?: Date } = {
    signedIn: false,
    username: '',
    autoTheme: VALID_THEMES[0],
  };

  private updateInterval?: ReturnType<typeof setInterval>;

  constructor(private scope: ExtensionScope) {
  }

  setFeedbackCount(count: number | string): void {
    this.unread.feedback = normalizeNumeric(count);
  }

  setMessageCount(count: number | string): void {
    this.unread.messages = normalizeNumeric(count);
  }

  setWatchCount(count: number | string): void {
    this.unread.watch = normalizeNumeric(count);
  }

  setSignedIn(signedIn: boolean): void {
    this.meta.signedIn = signedIn;

    if (this.meta.signedIn) {
      this.setBadgeSignedIn();
    } else {
      ExtensionManager.setBadgeSignedOut();
    }
  }

  getSignedIn(): boolean {
    return this.meta.signedIn;
  }

  setUsername(username: string): void {
    this.meta.username = username || '';
  }

  setAutoTheme(themeName: string): void {
    this.meta.autoTheme = themeName;
  }

  setLastCheck(date: Date): void {
    this.meta.lastCheck = date;
  }

  getLastCheck(): Date | undefined {
    return this.meta.lastCheck;
  }

  setAutoThemeFromBodyClasses(bodyClass: string): void {
    let newValue: ThemeName = VALID_THEMES[0];
    if (bodyClass.includes('light-green')) {
      newValue = 'green';
    } else {
      const mainThemeMatch = bodyClass.match(/theme-(light|dark)/);
      if (mainThemeMatch !== null) {
        newValue = mainThemeMatch[1] as ThemeName;
      }
    }
    this.setAutoTheme(newValue);
  }

  getPopupData(): PopupData {
    return {
      ...this.unread,
      ...this.getOptionsData(),
      signedIn: this.meta.signedIn,
      username: this.meta.username,
    };
  }

  getOptionsData(): OptionsData {
    return {
      prefs: this.scope.options.getAll(),
      version: chrome.runtime.getManifest().version,
      theme: this.getTheme(),
    };
  }

  getTheme(): ExtensionOptions['theme'] {
    const setting = this.scope.options.get('theme');
    if (setting === 'auto') {
      if (this.meta.autoTheme) return this.meta.autoTheme;
      throw new Error('Auto theme value not found');
    }

    return setting;
  }

  /**
   * Updates the count on the extension icon and sends a notification if it increased
   */
  updateBadgeCounter(): void {
    const value = Object.keys(this.unread)
      .reduce((total, key) => total + this.unread[key], 0);
    const newText = value === 0 ? '' : shortenCount(value);
    chrome.browserAction.getBadgeText({}, (currentText) => {
      if (currentText === newText) return;

      chrome.browserAction.setBadgeText({ text: newText });

      if (value === 0 || (!Number.isNaN(currentText) && currentText > newText)) return;

      this.scope.notifier.show(this.unread, NOTIF_ID);
    });
  }

  static setBadgeSignedOut(): void {
    chrome.browserAction.setBadgeBackgroundColor({ color: '#222' });
    chrome.browserAction.setBadgeText({ text: UNKNOWN_BADGE_TEXT });
  }

  setBadgeSignedIn(): void {
    const color = this.scope.options.get('badgeColor');
    if (color) chrome.browserAction.setBadgeBackgroundColor({ color });
  }

  setBadgeColor(): void {
    chrome.browserAction.getBadgeText({}, (ret) => {
      if (ret === UNKNOWN_BADGE_TEXT) return;

      this.setBadgeSignedIn();
    });
  }

  restartUpdateInterval(immediateRecheck = true): void {
    if (typeof this.updateInterval !== 'undefined') clearInterval(this.updateInterval);
    this.updateInterval = setInterval(() => checkSiteData(this.scope), this.scope.options.get('updateInterval') * 60e3);
    if (immediateRecheck) checkSiteData(this.scope);
  }
}
