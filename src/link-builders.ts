import { FeedbackMessageTypes, LinkCreator, WatchMessageTypes } from './common-types.js';
import { LINKS } from './common.js';

export const getTypedPath = (baseUrl: string, type?: string): string =>
  baseUrl + (type ? `/${type.toLowerCase()}` : '');

export const getFeedbackNotifsPath: LinkCreator<FeedbackMessageTypes> = (type): string =>
  getTypedPath(LINKS.feedback, type);

export const getBetaNotifsPath: LinkCreator<unknown> = (): string => LINKS.betaNotifications;

export const getWatchNotifsPath: LinkCreator<WatchMessageTypes> = (type?: WatchMessageTypes): string =>
  getTypedPath(LINKS.watch, type === 'misc' ? 'miscellaneous' : type);

export const getNotesPath = (): string => LINKS.notes;
