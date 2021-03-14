import { isFirefox, NOTIF_ID } from '../common.js';
import { ButtonIndexes, ExtensionScope, NotifyParams, UnreadCounts } from '../common-types.js';
import { plural } from '../utils.js';
import { OptionsManager } from './options-manager.js';

const DEFAULT_BUTTON_INDEXES: ButtonIndexes = {
  feedback: -1,
  messages: -1,
  watch: -1,
  dismiss: -1,
};

export class NotificationManager {
  private buttonIndexes: Record<string, ButtonIndexes> = {
    [NOTIF_ID]: DEFAULT_BUTTON_INDEXES,
  };

  /**
   * Record that maps a timeout ID to each notification ID
   */
  private timeoutIds: Record<string, ReturnType<typeof setTimeout>> = {};

  private sound: HTMLAudioElement;

  constructor(private scope: ExtensionScope) {
    this.sound = new Audio();
    this.sound.src = 'da_notifier.ogg';
    this.sound.preload = 'true';
  }

  buildNotifParams(unread: UnreadCounts, id : string = NOTIF_ID): NotifyParams {
    const buttons = [];
    const hasFeedback = unread.feedback > 0;
    const hasMessages = unread.messages > 0;
    const hasWatch = unread.watch > 0;
    const displayIcons = this.scope.options.get('notifIcons');
    const bellStyle = this.scope.options.get('bellIconStyle');
    const chatStyle = this.scope.options.get('chatIconStyle');
    const watchStyle = this.scope.options.get('watchIconStyle');

    this.buttonIndexes[id] = { ...DEFAULT_BUTTON_INDEXES };
    let currentIndex = 0;
    if (hasFeedback) {
      buttons.push({
        title: `View ${plural(unread.feedback, 'Notification')}`,
        iconUrl: displayIcons ? (isFirefox ? '🔔' : `img/bell-${bellStyle}.svg`) : undefined,
      });
      this.buttonIndexes[id].feedback = currentIndex++;
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
    const params: NotifyParams = {
      type: 'basic',
      iconUrl: 'img/notif-128.png',
      title: 'DeviantArt',
      message: 'You have unread notifications',
    };

    if (!isFirefox) {
      // Chrome is limited to a maximum of two buttons
      if (buttons.length > 2) {
        // If there are too many, replace them with a more verbose message & simple dismiss action instead
        params.message += NotificationManager.constructFirefoxMessage(buttons, false)
          .replace(/\n\n/g, '\n');
        params.buttons = [{ title: 'Dismiss' }];
        this.buttonIndexes[id] = {
          ...DEFAULT_BUTTON_INDEXES,
          dismiss: 0,
        };
      } else {
        params.buttons = buttons;
      }
      (params as chrome.notifications.NotificationOptions).requireInteraction = persist;
      (params as chrome.notifications.NotificationOptions).silent = true;
    } else {
      params.message += NotificationManager.constructFirefoxMessage(buttons, displayIcons);
    }

    return params;
  }

  static constructFirefoxMessage(
    buttons: Array<{ title: string, iconUrl: string | undefined }>,
    displayIcons: boolean,
  ): string {
    let restText = ':\n';
    buttons.forEach((btn) => {
      restText += `\n${displayIcons ? `${btn.iconUrl}   ` : ''}${btn.title.replace(/^View /, '')}`;
    });
    return restText;
  }

  createNotif(params: NotifyParams, id = NOTIF_ID): void {
    const next = () => {
      if (!(params as chrome.notifications.NotificationOptions).requireInteraction) this.setNotifTimeout(id);
    };
    if (isFirefox) {
      browser.notifications.create(id, params as browser.notifications.CreateNotificationOptions).then(next);
    } else {
      chrome.notifications.create(id, params, next);
    }
  }

  clearNotif(id = NOTIF_ID): Promise<void> {
    return new Promise<void>((res) => {
      chrome.notifications.clear(id, () => {
        delete this.timeoutIds[id];
        res();
      });
    });
  }

  setNotifTimeout(id = NOTIF_ID): void {
    this.timeoutIds[id] = setTimeout(() => {
      void this.clearNotif(id);
    }, this.scope.options.get('notifTimeout') * 1e3);
  }

  clearTimeout(id = NOTIF_ID): void {
    if (typeof this.timeoutIds[id] === 'number') {
      clearInterval(this.timeoutIds[id]);
      delete this.timeoutIds[id];
    }
  }

  getButtonIndexes(id: string = NOTIF_ID): ButtonIndexes {
    return this.buttonIndexes[id];
  }

  playSound(): void {
    this.sound.currentTime = 0;
    void this.sound.play();
  }

  show(unread: UnreadCounts, id: string = NOTIF_ID, prefs: OptionsManager = this.scope.options): void {
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
