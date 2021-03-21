import {
  ExtensionManagerMeta,
  ExtensionOptions,
  ExtensionScope,
  FeedbackMessageCounts,
  OptionsData,
  PopupData,
  ThemeName,
  TotalMessageCounts,
  WatchMessageCounts,
} from '../common-types.js';
import { DEFAULT_MESSAGE_COUNTS, NOTIF_ID, VALID_THEMES } from '../common.js';
import { checkSiteData } from '../data-fetching.js';
import { ExtensionAction } from '../extension-action.js';
import { executeAction, normalizeNumeric, recursiveSum, shortenCount } from '../utils.js';

const UNKNOWN_BADGE_TEXT = '?';

export class ExtensionManager {
  private totalCounts: TotalMessageCounts = { ...DEFAULT_MESSAGE_COUNTS };

  private newCounts: TotalMessageCounts = { ...DEFAULT_MESSAGE_COUNTS };

  private meta: ExtensionManagerMeta = {
    signedIn: false,
    username: '',
    autoTheme: VALID_THEMES[0],
    updating: false,
  };

  private updateInterval?: ReturnType<typeof setInterval>;

  constructor(private scope: ExtensionScope) {
  }

  setFeedbackCount(counts: FeedbackMessageCounts): void {
    this.totalCounts = { ...this.totalCounts, feedback: counts };
  }

  setMessageCount(count: number | string): void {
    this.totalCounts.messages = normalizeNumeric(count);
  }

  setWatchCount(counts: WatchMessageCounts): void {
    this.totalCounts = { ...this.totalCounts, watch: counts };
  }

  setNewFeedbackCount(counts: Partial<FeedbackMessageCounts>): void {
    this.newCounts = { ...this.newCounts, feedback: { ...this.newCounts.feedback, ...counts } };
  }

  setNewMessageCount(count: number | string): void {
    this.newCounts.messages = normalizeNumeric(count);
  }

  setNewWatchCount(counts: Partial<WatchMessageCounts>): void {
    this.newCounts = { ...this.newCounts, watch: { ...this.newCounts.watch, ...counts } };
  }

  setUpdating(promise: Promise<unknown>): void {
    this.meta.updating = true;
    this.broadcastPopupUpdate();
    promise.finally(() => {
      this.meta.updating = false;
      this.broadcastPopupUpdate();
    });
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

  getUpdating(): boolean {
    return this.meta.updating;
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

  setAutoThemeFromBodyClasses(bodyClass: string | null): void {
    let newValue: ThemeName = VALID_THEMES[0];
    if (typeof bodyClass === 'string') {
      if (bodyClass.includes('light-green')) {
        newValue = 'green';
      } else {
        const mainThemeMatch = bodyClass.match(/theme-(light|dark)/);
        if (mainThemeMatch !== null) {
          newValue = mainThemeMatch[1] as ThemeName;
        }
      }
    }
    this.setAutoTheme(newValue);
  }

  getPopupData(): PopupData {
    return {
      ...this.totalCounts,
      ...this.getOptionsData(),
      ...this.meta,
      lastCheck: this.meta.lastCheck?.toISOString(),
      newCounts: this.newCounts,
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
    const value = Object.keys(this.newCounts)
      .reduce((total, key) => total + recursiveSum(this.newCounts[key as keyof TotalMessageCounts]), 0);
    const newText = value === 0 ? '' : shortenCount(value);
    chrome.browserAction.getBadgeText({}, (currentText) => {
      if (currentText === newText) return;

      chrome.browserAction.setBadgeText({ text: newText });

      if (value === 0 || (!Number.isNaN(currentText) && currentText > newText)) return;

      this.scope.notifier.show(this.newCounts, NOTIF_ID);
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

  broadcastPopupUpdate(): void {
    void executeAction(ExtensionAction.BROADCAST_POPUP_UPDATE, this.getPopupData());
  }
}
