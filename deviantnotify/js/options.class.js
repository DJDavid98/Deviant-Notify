import {
  DEFAULT_OPTIONS,
  VALID_DOMAINS,
  VALID_ICON_STYLES,
  VALID_THEMES,
  VALID_WATCH_MESSAGE_TYPES,
} from './common.js';
import { yiq } from './utils.js';
import { checkDomainPermissions } from './domain-permissions.js';

export class Options {
  /**
   * @param {ExtensionScope} scope
   * @param {ExtensionOptions} values
   */
  constructor(scope, values = {}) {
    /**
     * @type {ExtensionScope}
     * @private
     */
    this.scope = scope;
    /**
     * @type {ExtensionOptions}
     * @private
     */
    this.values = values;
  }

  loadUserOptions() {
    let parsed;
    try {
      parsed = JSON.parse(localStorage.getItem('options'));
    } catch (e) {
      console.error('Could not load user options, see error below');
      console.error(e);
    }

    let untrustedOptions;
    if (typeof parsed !== 'undefined' && parsed !== null) {
      untrustedOptions = { ...DEFAULT_OPTIONS, ...parsed };
    } else {
      untrustedOptions = DEFAULT_OPTIONS;
    }

    return this.processOptions(untrustedOptions, false);
  }

  setSetting(name, inputValue) {
    return new Promise((res, rej) => {
      let value = inputValue;
      const errors = [];
      switch (name) {
        case 'badgeColor':
          if (typeof value !== 'string') {
            errors.push('Badge color type is invalid');
          } else if (!/^#[a-f\d]{6}$/i.test(value)) {
            errors.push('Badge color format is invalid (must be #RRGGBB)');
          } else {
            const rgb = value.substring(1)
              .match(/.{2}/g)
              .map((n) => parseInt(n, 16));
            if (yiq(...rgb) > 180) errors.push('Badge color is too bright, the number would not be readable');
          }
          break;
        case 'preferredDomain':
          if (typeof value !== 'string' || VALID_DOMAINS.indexOf(value) === -1) {
            errors.push('The domain is invalid');
          } else {
            checkDomainPermissions(value)
              .then(() => {
                this.resolveSetting(name, value, res);
              })
              .catch(() => {
                errors.push('The extension does not have permission to use the selected domain');
                this.rejectSetting(name, value, errors, rej);
              });
            return;
          }
          break;
        case 'theme':
          if (typeof value !== 'string' || VALID_THEMES.indexOf(value) === -1) errors.push('The theme is invalid');
          break;
        case 'updateInterval':
          value = parseInt(value, 10);
          if (Number.isNaN(value) || !Number.isFinite(value)) {
            errors.push('The update interval must be a number');
          } else if (value < 1) errors.push('The update interval cannot be less than 1 minute');
          break;
        case 'notifEnabled':
          if (typeof value !== 'boolean') errors.push('Invalid value for notification enable/disable toggle');
          break;
        case 'notifSound':
          if (typeof value !== 'boolean') errors.push('Invalid value for notification sound on/off toggle');
          break;
        case 'notifIcons':
          if (typeof value !== 'boolean') errors.push('Invalid value for notification button icons on/off toggle');
          break;
        case 'bellIconStyle':
          if (typeof value !== 'string' || VALID_ICON_STYLES.bell.indexOf(value) === -1) {
            errors.push('The bell icon style is invalid');
          }
          break;
        case 'chatIconStyle':
          if (typeof value !== 'string' || VALID_ICON_STYLES.chat.indexOf(value) === -1) {
            errors.push('The chat icon style is invalid');
          }
          break;
        case 'watchIconStyle':
          if (typeof value !== 'string' || VALID_ICON_STYLES.watch.indexOf(value) === -1) {
            errors.push('The watch icon style is invalid');
          }
          break;
        case 'watchDisabled':
          if (!Array.isArray(value)) {
            errors.push('The disabled watch message types must be an array');
          } else {
            value = value.filter((el) => VALID_WATCH_MESSAGE_TYPES.includes(el));
          }
          break;
        case 'notifTimeout':
          value = parseInt(value, 10);
          if (Number.isNaN(value) || !Number.isFinite(value)) {
            errors.push('The notification timeout must be a number');
          } else if (value < 0) errors.push('The notification timeout must be greater than or equal to 0 seconds');
          break;
        default:
          errors.push(`Missing handler for setting ${name}`);
      }

      if (errors.length) {
        Options.rejectSetting(name, value, errors, rej);
        return;
      }

      this.resolveSetting(name, value, res);
    });
  }

  /**
   * @private
   */
  static rejectSetting(name, value, errors, rej) {
    console.error('Failed to set setting', name, value, errors);
    rej(errors);
  }

  /**
   * @private
   */
  resolveSetting(name, value, res) {
    this.values[name] = value;
    this.postSetting(name, value);
    res();
  }

  processOptions(setThese, recheck = true) {
    return new Promise((res) => {
      const promises = [];
      $.each(setThese, (key, value) => {
        promises.push(
          this.setSetting(key, value)
            .then(
              () => ({ status: true }),
              (errors) => ({
                status: false,
                key,
                errors,
              }),
            ),
        );
      });
      Promise.all(promises)
        .then((results) => {
          this.saveOptions(recheck);
          res(results);
        });
    });
  }

  saveOptions(recheck = true) {
    localStorage.setItem('options', JSON.stringify(this.values));
    this.scope.extension.restartUpdateInterval(recheck);
  }

  postSetting(name, value) {
    switch (name) {
      case 'badgeColor':
        this.scope.extension.setBadgeColor();
        break;
      case 'notifEnabled':
        if (value === false) this.scope.notifier.clearNotif();
        break;
      case 'notifTimeout':
        if (value !== 0) this.scope.notifier.setNotifTimeout();
    }
  }

  get(name) {
    return this.values[name];
  }

  getAll() {
    return this.values;
  }
}
