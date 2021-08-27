import { ExtensionOptions, ExtensionScope, OptionProcessingResult } from '../common-types.js';
import {
  DEFAULT_OPTIONS,
  VALID_DOMAINS,
  VALID_FEEDBACK_MESSAGE_TYPES,
  VALID_ICON_STYLES,
  VALID_THEMES,
  VALID_WATCH_MESSAGE_TYPES,
} from '../common.js';
import { checkDomainPermissions } from '../domain-permissions.js';
import { AsyncLocalStorage, AsyncSyncStorage } from '../storage.js';
import { broaderArrayIncludes, eachStrict, isRgbArray } from '../utils.js';
import { AsyncStorage } from './async-storage.js';

export class OptionsManager {
  private readonly LOCAL_STORAGE_KEY = 'options';

  constructor(
    private scope: ExtensionScope,
    private values: ExtensionOptions = { ...DEFAULT_OPTIONS },
  ) {
  }

  loadUserOptions(): Promise<OptionProcessingResult[]> {
    let parsed;
    try {
      const item = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (item) {
        parsed = JSON.parse(item);
      }
    } catch (e) {
      console.error('Could not load user options, see error below');
      console.error(e);
    }

    let untrustedOptions = { ...DEFAULT_OPTIONS };
    if (typeof parsed !== 'undefined' && parsed !== null) {
      untrustedOptions = { ...untrustedOptions, ...parsed };
    }

    return this.processOptions(untrustedOptions, false);
  }

  setSetting<K extends keyof ExtensionOptions>(name: K, inputValue: ExtensionOptions[K]): Promise<void> {
    return new Promise((res, rej) => {
      let value = inputValue;
      const errors: string[] = [];
      switch (name) {
        case 'badgeColor':
          if (typeof value !== 'string') {
            errors.push('Badge color type is invalid');
          } else if (!/^#[a-f\d]{6}$/i.test(value)) {
            errors.push('Badge color format is invalid (must be #RRGGBB)');
          } else {
            const rgbMatch = value.substring(1).match(/.{2}/g);
            const rgb = rgbMatch ? rgbMatch.map((n) => parseInt(n, 16)) : [];
            if (!isRgbArray(rgb)) errors.push(`Expected color value to have 3 RGB components, found ${rgb.length}`);
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
                OptionsManager.rejectSetting(name, value, errors, rej);
              });
            return;
          }
          break;
        case 'theme':
          if (typeof value !== 'string' || !broaderArrayIncludes(VALID_THEMES, value)) {
            errors.push('The theme is invalid');
          }
          break;
        case 'updateInterval':
          // @ts-ignore
          value = parseInt(value, 10);
          if (Number.isNaN(value) || !Number.isFinite(value)) {
            errors.push('The update interval must be a number');
          } else if (value < 1) errors.push('The update interval cannot be less than 1 minute');
          break;
        case 'notifEnabled':
          if (typeof value !== 'boolean') errors.push('Invalid value for notification enable/disable toggle');
          break;
        case 'useSyncStorage':
          if (typeof value !== 'boolean') errors.push('Invalid value for synchronize read state toggle');
          break;
        case 'notifSound':
          if (typeof value !== 'boolean') errors.push('Invalid value for notification sound on/off toggle');
          break;
        case 'notifIcons':
          if (typeof value !== 'boolean') errors.push('Invalid value for notification button icons on/off toggle');
          break;
        case 'bellIconStyle':
          if (typeof value !== 'string' || !broaderArrayIncludes(VALID_ICON_STYLES.bell, value)) {
            errors.push('The bell icon style is invalid');
          }
          break;
        case 'chatIconStyle':
          if (typeof value !== 'string' || !broaderArrayIncludes(VALID_ICON_STYLES.chat, value)) {
            errors.push('The chat icon style is invalid');
          }
          break;
        case 'watchIconStyle':
          if (typeof value !== 'string' || !broaderArrayIncludes(VALID_ICON_STYLES.watch, value)) {
            errors.push('The watch icon style is invalid');
          }
          break;
        case 'watchDisabled':
          if (!Array.isArray(value)) {
            errors.push('The disabled watch message types must be an array');
          } else {
            // @ts-ignore
            value = value.filter((el) => VALID_WATCH_MESSAGE_TYPES.includes(el));
          }
          break;
        case 'feedbackDisabled':
          if (!Array.isArray(value)) {
            errors.push('The disabled feedback message types must be an array');
          } else {
            // @ts-ignore
            value = value.filter((el) => VALID_FEEDBACK_MESSAGE_TYPES.includes(el));
          }
          break;
        case 'notifTimeout':
          // @ts-ignore
          value = parseInt(value, 10);
          if (Number.isNaN(value) || !Number.isFinite(value)) {
            errors.push('The notification timeout must be a number');
          } else if (value < 0) errors.push('The notification timeout must be greater than or equal to 0 seconds');
          break;
        default:
          errors.push(`Missing handler for setting ${name}`);
      }

      if (errors.length) {
        OptionsManager.rejectSetting(name, value, errors, rej);
        return;
      }

      this.resolveSetting(name, value, res);
    });
  }

  private static rejectSetting<K extends keyof ExtensionOptions>(
    name: K,
    value: ExtensionOptions[K],
    errors: string[],
    rej: (errors: string[],
    ) => void,
  ): void {
    console.error('Failed to set setting', name, value, errors);
    rej(errors);
  }

  private resolveSetting<K extends keyof ExtensionOptions>(
    name: K,
    value: ExtensionOptions[K],
    res: VoidFunction,
  ): void {
    const oldValue = this.values[name];
    this.values[name] = value;
    this.postSetting(name, value, oldValue);
    res();
  }

  async processOptions(setThese: ExtensionOptions, recheck = true): Promise<OptionProcessingResult[]> {
    const promises: Promise<OptionProcessingResult>[] = [];
    eachStrict(setThese, (key, value) => {
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
    return Promise.all(promises)
      .then((results) => {
        this.saveOptions(recheck);
        return results;
      });
  }

  saveOptions(recheck = true): void {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.values));
    this.scope.extension.restartUpdateInterval(recheck);
  }

  postSetting<K extends keyof ExtensionOptions>(
    name: K,
    value: ExtensionOptions[K],
    oldValue: ExtensionOptions[K],
  ): void {
    switch (name) {
      case 'badgeColor':
        this.scope.extension.setBadgeColor();
        break;
      case 'notifEnabled':
        if (value === false) void this.scope.notifier.clearNotif();
        break;
      case 'notifTimeout':
        if (value !== 0) this.scope.notifier.setNotifTimeout();
        break;
      case 'useSyncStorage':
        if (oldValue !== value) {
          void this.scope.read.migrateData(
            this.getReadStateStorage(oldValue as ExtensionOptions['useSyncStorage']),
            this.getReadStateStorage(value as ExtensionOptions['useSyncStorage']),
          );
        }
        break;
    }
  }

  get<K extends keyof ExtensionOptions>(name: K): ExtensionOptions[K];

  get(name: string): unknown {
    return this.values[name as keyof ExtensionOptions];
  }

  getAll(): ExtensionOptions {
    return this.values;
  }

  getReadStateStorage(settingValue = this.get('useSyncStorage')): AsyncStorage {
    if (settingValue) {
      return AsyncSyncStorage;
    }
    return AsyncLocalStorage;
  }
}
