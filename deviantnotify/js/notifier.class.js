import { isFirefox, NOTIF_ID } from './common.js';
import { plural } from './utils.js';

/**
 * @typedef NotifyParams
 * @property {string} iconUrl
 * @property {string} type
 * @property {string} title
 * @property {string} message
 */
/**
 * @typedef ButtonIndexes
 * @property {number} notifs
 * @property {number} messages
 * @property {number} watch
 * @property {number} dismiss
 */

/** @type {ButtonIndexes} */
const DEFAULT_BUTTON_INDEXES = {
  notifs: -1,
  messages: -1,
  watch: -1,
  dismiss: -1,
};

export class Notifier {
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
     * @type {Record<string, ButtonIndexes>}}
     * @private
     */
    this.buttonIndexes = {
      [NOTIF_ID]: DEFAULT_BUTTON_INDEXES,
    };
    /**
     * Record that maps a timeout ID to each notification ID
     * @type {Record<string, number>}
     * @private
     */
    this.timeoutIds = {};

    this.sound = new Audio();
    this.sound.src = 'da_notifier.ogg';
    this.sound.preload = true;
  }

  /**
   *
   * @param {UnreadCounts} unread
   * @param id
   * @return {NotifyParams}
   */
  buildNotifParams(unread, id = NOTIF_ID) {
    const buttons = [];
    const hasNotifs = unread.notifs > 0;
    const hasMessages = unread.messages > 0;
    const hasWatch = unread.watch > 0;
    const displayIcons = this.scope.options.get('notifIcons');
    const bellStyle = this.scope.options.get('bellIconStyle');
    const chatStyle = this.scope.options.get('chatIconStyle');
    const watchStyle = this.scope.options.get('watchIconStyle');

    this.buttonIndexes[id] = { ...DEFAULT_BUTTON_INDEXES };
    let currentIndex = 0;
    if (hasNotifs) {
      buttons.push({
        title: `View ${plural(unread.notifs, 'Notification')}`,
        iconUrl: displayIcons ? (isFirefox ? '🔔' : `img/bell-${bellStyle}.svg`) : undefined,
      });
      this.buttonIndexes[id].notifs = currentIndex++;
    }
    if (hasMessages) {
      buttons.push({
        title: `View ${plural(unread.messages, 'Note')}`,
        iconUrl: displayIcons ? (isFirefox ? '📝' : `img/chat-${chatStyle}.svg`) : undefined,
      });
      this.buttonIndexes[id].messages = currentIndex++;
    }
    if (hasWatch) {
      buttons.push({
        title: `View ${plural(unread.watch, 'Watched Item')}`,
        iconUrl: displayIcons ? (isFirefox ? '🥽' : `img/watch-${watchStyle}.svg`) : undefined,
      });
      this.buttonIndexes[id].watch = currentIndex++;
    }

    const persist = this.scope.options.get('notifTimeout') === 0;
    const params = {
      type: 'basic',
      iconUrl: 'img/notif-128.png',
      title: 'DeviantArt',
      message: 'You have unread notifications',
    };

    if (!isFirefox) {
      // Chrome is limited to a maximum of two buttons
      if (buttons.length > 2) {
        // If there are too many, replace them with a more verbose message & simple dismiss action instead
        params.message += Notifier.constructFirefoxMessage(buttons, false).replace(/\n\n/g, '\n');
        params.buttons = [{ title: 'Dismiss' }];
        this.buttonIndexes[id] = {
          ...DEFAULT_BUTTON_INDEXES,
          dismiss: 0,
        };
      } else {
        params.buttons = buttons;
      }
      params.requireInteraction = persist;
      params.silent = true;
    } else {
      params.message += Notifier.constructFirefoxMessage(buttons, displayIcons);
    }

    return params;
  }

  /**
   * @param {Array<{ title: string, iconUrl: string | undefined }>}buttons
   * @param {boolean} displayIcons
   * @return {string}
   */
  static constructFirefoxMessage(buttons, displayIcons) {
    let restText = ':\n';
    buttons.forEach((btn) => {
      restText += `\n${displayIcons ? `${btn.iconUrl}   ` : ''}${btn.title.replace(/^View /, '')}`;
    });
    return restText;
  }

  createNotif(params, id = NOTIF_ID) {
    const next = () => {
      if (!params.requireInteraction) this.setNotifTimeout(id);
    };
    if (isFirefox) {
      browser.notifications.create(id, params)
        .then(next);
    } else {
      chrome.notifications.create(id, params, next);
    }
  }

  clearNotif(id = NOTIF_ID) {
    return new Promise((res) => {
      chrome.notifications.clear(id, () => {
        delete this.timeoutIds[id];
        res();
      });
    });
  }

  setNotifTimeout(id = NOTIF_ID) {
    this.timeoutIds[id] = setTimeout(() => {
      void this.clearNotif(id);
    }, this.scope.options.get('notifTimeout') * 1000);
  }

  clearTimeout(id = NOTIF_ID) {
    if (typeof this.timeoutIds[id] === 'number') {
      clearInterval(this.timeoutIds[id]);
      delete this.timeoutIds[id];
    }
  }

  /**
   * @param {string} id
   * @return {ButtonIndexes}
   */
  getButtonIndexes(id = NOTIF_ID) {
    return this.buttonIndexes[id];
  }

  playSound() {
    this.sound.currentTime = 0;
    void this.sound.play();
  }

  /**
   *
   * @param {UnreadCounts} unread
   * @param {string} id
   * @param {Options} prefs
   */
  show(unread, id = NOTIF_ID, prefs = this.scope.options) {
    if (prefs.get('notifSound')) {
      this.playSound();
    }
    if (prefs.get('notifEnabled')) {
      this.clearTimeout(id);

      const params = this.buildNotifParams(unread, id);

      this.createNotif(params, id);
    }
  }
}
