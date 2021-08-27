import type { FunctionComponent, JSX as pJSX } from 'preact';
import type { DeepPartial } from 'tsdef';
import { ExtensionManager } from './classes/extension-manager.js';
import { NotificationManager } from './classes/notification-manager.js';
import { OptionsManager } from './classes/options-manager.js';
import { ReadStateManager } from './classes/read-state-manager.js';
import { VALID_FEEDBACK_MESSAGE_TYPES, VALID_THEMES, VALID_WATCH_MESSAGE_TYPES } from './common.js';
import { ExtensionAction } from './extension-action.js';

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type WatchMessageTypes = ArrayElement<typeof VALID_WATCH_MESSAGE_TYPES>;
export type FeedbackMessageTypes = ArrayElement<typeof VALID_FEEDBACK_MESSAGE_TYPES>;

export type WatchMessageRecord<T> = Record<WatchMessageTypes, T>;
export type FeedbackMessageRecord<T> = Record<FeedbackMessageTypes, T>;

export interface TotalMessagesRecord<T> {
  feedback: FeedbackMessageRecord<T>;
  watch: WatchMessageRecord<T>;
  messages: T;
}

export type WatchMessageCounts = WatchMessageRecord<number>;
export type FeedbackMessageCounts = FeedbackMessageRecord<number>;
export type TotalMessageCounts = TotalMessagesRecord<number>;

export type ExtensionReadStates = TotalMessagesRecord<Date | null>;

export type ThemeName = ArrayElement<typeof VALID_THEMES>;

export interface ExtensionScope {
  options: OptionsManager;
  extension: ExtensionManager;
  notifier: NotificationManager;
  read: ReadStateManager;
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
  feedbackDisabled: string[];
  useSyncStorage: boolean;
}

export type CookieObject = browser.cookies.Cookie | chrome.cookies.Cookie;
export type NotifyParams =
  browser.notifications.CreateNotificationOptions
  | chrome.notifications.NotificationOptions;

export interface MessageCenterApiResponse<Type = string, ResultType = unknown> {
  counts: { total: number };
  settings: { type: Type, stacked: boolean, sort: string };
  hasMore: boolean;
  cursor: string;
  results: ResultType[];
}

export interface MessageCenterItemResult<Subject = unknown> {
  messageId: string;
  type: string;
  orphaned: boolean;
  ts: string;
  isNew: boolean;
  originator: {
    userId: number;
    useridUuid: string;
    username: string;
    usericon: string;
    type: string;
    isWatching: boolean;
    isNewDeviant: boolean;
  };
  subject: Subject;
}

interface CommonPageData {
  version: string;
  prefs: ExtensionOptions;
  theme: string;
}

export interface ExtensionManagerMeta {
  signedIn: boolean;
  autoTheme: string;
  username: string;
  lastCheck?: Date;
  updating: boolean;
}

export interface PopupData extends TotalMessageCounts, CommonPageData, Omit<ExtensionManagerMeta, 'lastCheck'> {
  newCounts: TotalMessageCounts;
  lastCheck?: string;
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
export type FC<P = {}> = FunctionComponent<P>;
// eslint-disable-next-line @typescript-eslint/ban-types
export type VFC<P = {}> = FunctionComponent<P & { children?: never }>;

export interface ButtonIndexes {
  feedback: number;
  messages: number;
  watch: number;
  dismiss: number;
  read: number;
}

export interface ApiConsoleResponse<Data> {
  results: Data;
}

export interface NotesFolder {
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

export interface ApiUser {
  userid: string;
  username: string;
  usericon: string;
  type: string;
}

interface NotesListItem {
  /**
   * UUID
   */
  noteid: string;
  /**
   * ISO timestamp
   */
  ts: string;
  /**
   * Indicates whether the note was opened before
   */
  unread: boolean;
  starred: boolean;
  /**
   * True probably means it's a draft
   */
  sent: false;
  subject: string;
  preview: string;
  body: string;
  /** Sender details */
  user: ApiUser;
  recipients: ApiUser[];
}

/* eslint-disable camelcase */
export type NotesListApiResponse = ApiConsoleResponse<NotesListItem[]>
  & ({ has_more: true; next_offset: number } | { has_more: false; next_offset: null })

/* eslint-enable camelcase */

export interface ExtensionActionData {
  [ExtensionAction.UPDATE_OPTIONS]: ExtensionOptions;
  [ExtensionAction.OPEN_SIGN_IN_PAGE]: void;
  [ExtensionAction.GET_SELECTORS]: void;
  [ExtensionAction.ON_SITE_UPDATE]: { bodyClass: string };
  [ExtensionAction.TEST_MESSAGE]: ExtensionOptions;
  [ExtensionAction.GET_POPUP_DATA]: void;
  [ExtensionAction.GET_OPTIONS_DATA]: void;
  [ExtensionAction.OPEN_NOTIFS_PAGE]: void;
  [ExtensionAction.OPEN_MESSAGES_PAGE]: void;
  [ExtensionAction.OPEN_WATCH_PAGE]: void;
  [ExtensionAction.INSTANT_UPDATE]: void;
  [ExtensionAction.BROADCAST_POPUP_UPDATE]: PopupData;
  [ExtensionAction.SET_MARK_READ]: DeepPartial<ExtensionReadStates>;
  [ExtensionAction.CLEAR_MARK_READ]: void;
}

interface GetSelectorsData {
  onlyDomain: string;
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
  [ExtensionAction.INSTANT_UPDATE]: void;
  [ExtensionAction.BROADCAST_POPUP_UPDATE]: PopupData;
  [ExtensionAction.SET_MARK_READ]: void;
  [ExtensionAction.CLEAR_MARK_READ]: void;
}

/**
 * For the default handler to work, this value must be in sync with the {@see ExtensionOptions} key
 */
export enum OptionsFieldNames {
  BADGE_COLOR = 'badgeColor',
  PREFERRED_DOMAIN = 'preferredDomain',
  THEME = 'theme',
  UPDATE_INTERVAL = 'updateInterval',
  NOTIF_SOUND = 'notifSound',
  WATCH_ENABLED = 'watchEnabled',
  WATCH_DISABLED = 'watchDisabled',
  FEEDBACK_ENABLED = 'feedbackEnabled',
  FEEDBACK_DISABLED = 'feedbackDisabled',
  NOTIF_ENABLED = 'notifEnabled',
  NOTIF_TIMEOUT = 'notifTimeout',
  NOTIF_ICONS = 'notifIcons',
  SYNC_STORAGE = 'useSyncStorage',
}

export type MessageHandlers = {
  [k in ExtensionAction]: (param: {
    data: ExtensionActionData[k],
    resp: (responseData: ExtensionActionResponses[k]) => void,
  }) => boolean | void;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type IntrinsicElements = pJSX.IntrinsicElements;
    type IntrinsicAttributes = pJSX.IntrinsicAttributes;
  }
}

export type LinkCreator<T = string> = (type?: T) => string;
export type ReadStateUpdater = (date: Date) => DeepPartial<ExtensionReadStates>;
export type TypedReadStateUpdater<T = string> = (type: T) => (date: Date) => DeepPartial<ExtensionReadStates>;

export enum StorageLocation {
  LOCAL = 'local',
  SYNC = 'sync',
  MANAGED = 'managed',
}
