import { LINKS } from './common.js';
import { makeURLFromPath } from './request-utils.js';
import { singleton } from './singleton.js';
import { createTab } from './utils.js';

export function openNotificationsPage(): void {
  createTab(makeURLFromPath(LINKS.notifs, singleton.options));
}

export function openMessagesPage(): void {
  createTab(makeURLFromPath(LINKS.messages, singleton.options));
}

export function openWatchPage(): void {
  createTab(makeURLFromPath(LINKS.watch, singleton.options));
}
