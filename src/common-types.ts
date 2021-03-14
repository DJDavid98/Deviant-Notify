import type { FunctionComponent } from 'preact';
import { ExtensionManager } from './classes/extension-manager.js';
import { NotificationManager } from './classes/notification-manager.js';
import { OptionsManager } from './classes/options-manager.js';
import { VALID_THEMES, VALID_WATCH_MESSAGE_TYPES } from './common.js';
import { ExtensionAction } from './extension-action.js';
import { RequestUtils } from './request-utils.js';

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type WatchMessageTypes = ArrayElement<typeof VALID_WATCH_MESSAGE_TYPES>;

export type ThemeName = ArrayElement<typeof VALID_THEMES>;

export interface ExtensionScope {
  options: OptionsManager;
  extension: ExtensionManager;
  reqUtils: RequestUtils;
  notifier: NotificationManager;
}

export interface ExtensionOptions {
  badgeColor: string;
  updateInterval: number;
  notifEnabled: boolean;
  notifTimeout: number;
  preferredDomain: string;
  notifIcons: boolean;
  theme: string;
  notifSound: boolean;
  bellIconStyle: string;
  chatIconStyle: string;
  watchIconStyle: string;
  watchDisabled: string[];
}

export type CookieObject = browser.cookies.Cookie | chrome.cookies.Cookie;
export type NotifyParams =
  browser.notifications.CreateNotificationOptions
  | chrome.notifications.NotificationOptions;

export interface FeedbackApiResponse {
  counts: { total: number };
}

export interface UnreadCounts {
  notifs: number;
  watch: number;
  messages: number;
}

interface CommonPageData {
  version: string;
  prefs: ExtensionOptions;
  theme: string;
}

export interface PopupData extends UnreadCounts, CommonPageData {
  signedIn: boolean;
  username: string;
}

export type OptionsData = CommonPageData;

export type OptionProcessingFailedResult = {
  status: false;
  key: keyof ExtensionOptions;
  errors: string[];
}
export type OptionProcessingSuccessfulResult = { status: true };
export type OptionProcessingResult = OptionProcessingSuccessfulResult | OptionProcessingFailedResult;

// eslint-disable-next-line @typescript-eslint/ban-types
export type VFC<P = {}> = FunctionComponent<P & { children?: never }>;

export interface ButtonIndexes {
  notifs: number;
  messages: number;
  watch: number;
  dismiss: number;
}

type DiFiStatus = 'SUCCESS' | 'FAIL';

export interface DiFiCallRequest {
  args: unknown[];
  class: string;
  method: string;
}

export interface DiFiCall {
  request: DiFiCallRequest;
  response: {
    content: unknown;
    status: DiFiStatus;
  };
}

export interface DiFiResponse {
  DiFi: { response: { calls: DiFiCall[], status: DiFiStatus } }
}

export interface DiFiNotesFolder {
  /**
   * UUID
   */
  folder: string;
  /**
   * UUID
   */
  parentid?: string;
  title: string;
  /**
   * Number as a string
   */
  count: string;
}

export interface ExtensionActionData {
  [ExtensionAction.UPDATE_OPTIONS]: ExtensionOptions;
  [ExtensionAction.OPEN_SIGN_IN_PAGE]: never;
  [ExtensionAction.GET_SELECTORS]: never;
  [ExtensionAction.ON_SITE_UPDATE]: { bodyClass: string };
  [ExtensionAction.TEST_MESSAGE]: ExtensionOptions;
  [ExtensionAction.GET_POPUP_DATA]: never;
  [ExtensionAction.GET_OPTIONS_DATA]: never;
  [ExtensionAction.OPEN_NOTIFS_PAGE]: never;
  [ExtensionAction.OPEN_MESSAGES_PAGE]: never;
  [ExtensionAction.OPEN_WATCH_PAGE]: never;
}

interface GetSelectorsData {
  onlyDomain: string
}

export interface ExtensionActionResponses {
  [ExtensionAction.UPDATE_OPTIONS]: { status: true } | {
    status: false,
    errors: Record<string, string[]>,
  };
  [ExtensionAction.OPEN_SIGN_IN_PAGE]: void;
  [ExtensionAction.GET_SELECTORS]: GetSelectorsData;
  [ExtensionAction.ON_SITE_UPDATE]: void;
  [ExtensionAction.TEST_MESSAGE]: void;
  [ExtensionAction.GET_POPUP_DATA]: PopupData;
  [ExtensionAction.GET_OPTIONS_DATA]: OptionsData;
  [ExtensionAction.OPEN_NOTIFS_PAGE]: void;
  [ExtensionAction.OPEN_MESSAGES_PAGE]: void;
  [ExtensionAction.OPEN_WATCH_PAGE]: void;
}

export enum OptionsFieldNames {
  BADGE_COLOR = 'badgeColor',
  PREFERRED_DOMAIN = 'preferredDomain',
  THEME = 'theme',
  UPDATE_INTERVAL = 'updateInterval',
  NOTIF_SOUND = 'notifSound',
  WATCH_ENABLED = 'watchEnabled',
  WATCH_DISABLED = 'watchDisabled',
  NOTIF_ENABLED = 'notifEnabled',
  NOTIF_TIMEOUT = 'notifTimeout',
  NOTIF_ICONS = 'notifIcons',
}
