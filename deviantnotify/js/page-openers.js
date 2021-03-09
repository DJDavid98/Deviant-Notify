import { createTab } from './utils.js';
import { LINKS } from './common.js';
import { singleton } from './singleton.js';
import { makeURLFromPath } from './request-utils.js';

export function openNotificationsPage() {
  createTab(makeURLFromPath(LINKS.notifs, singleton.options));
}

export function openMessagesPage() {
  createTab(makeURLFromPath(LINKS.messages, singleton.options));
}
