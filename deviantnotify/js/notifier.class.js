import { isFirefox, NOTIF_ID } from './common.js';
import { plural } from './utils.js';

/**
 * @typedef NotifyParams
 * @property {string} iconUrl
 * @property {string} type
 * @property {string} title
 * @property {string} message
 */

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
     * @type {Record<string, {notifs: number, messages: number}>}}
     * @private
     */
    this.buttonIndexes = {
      [NOTIF_ID]: {
        notifs: -1,
        messages: -1,
      },
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
    const displayIcons = this.scope.options.get('notifIcons');
    const bellStyle = this.scope.options.get('bellIconStyle');
    const chatStyle = this.scope.options.get('chatIconStyle');

    this.buttonIndexes[id] = {
      notifs: -1,
      messages: -1,
    };
    if (hasNotifs) {
      buttons.push({
        title: `View ${plural(unread.notifs, 'Notification')}`,
        iconUrl: displayIcons ? (isFirefox ? '🔔' : `img/bell-${bellStyle}.svg`) : undefined,
      });
      this.buttonIndexes[id].notifs = 0;
    }
    if (unread.messages > 0) {
      buttons.push({
        title: `View ${plural(unread.messages, 'Note')}`,
        iconUrl: displayIcons ? (isFirefox ? '📝' : `img/chat-${chatStyle}.svg`) : undefined,
      });
      this.buttonIndexes[id].messages = hasNotifs ? 1 : 0;
    }
    const persist = this.scope.options.get('notifTimeout') === 0;

    const params = {
      type: 'basic',
      iconUrl: 'img/notif-128.png',
      title: 'DeviantArt',
      message: 'You have unread notifications',
    };

    if (!isFirefox) {
      params.buttons = buttons;
      params.requireInteraction = persist;
      params.silent = true;
    } else {
      params.message += ':\n';
      buttons.forEach((btn) => {
        params.message += `\n${displayIcons ? `${btn.iconUrl}   ` : ''}${btn.title.replace(/^View /, '')}`;
      });
    }

    return params;
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
   */
  show(unread, id = NOTIF_ID) {
    if (this.scope.options.get('notifSound')) {
      this.playSound();
    }
    if (this.scope.options.get('notifEnabled')) {
      this.clearTimeout(id);

      const params = this.buildNotifParams(unread, id);

      this.createNotif(params, id);
    }
  }
}
