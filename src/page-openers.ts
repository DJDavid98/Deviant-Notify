import { FeedbackMessageTypes, WatchMessageTypes } from './common-types.js';
import { LINKS } from './common.js';
import { makeURLFromPath } from './request-utils.js';
import { singleton } from './singleton.js';
import { createTab } from './utils.js';

export function openPage(path: string): void {
  createTab(makeURLFromPath(path, singleton.options));
}

export function openFeedbackNotifsPage(type?: FeedbackMessageTypes): void {
  openPage(LINKS.feedback + (type ? `/${type}` : ''));
}

export function openNotesPage(): void {
  openPage(LINKS.notes);
}

export function openWatchNotifsPage(type?: WatchMessageTypes): void {
  openPage(LINKS.watch + (type ? `/${type}` : ''));
}
