import { ExtensionActionData, ExtensionActionResponses, ExtensionOptions } from './common-types.js';
import { isFirefox } from './common.js';
import { ExtensionAction } from './extension-action.js';

export function parseHtml(html: string): Document {
  return (new DOMParser()).parseFromString(html, 'text/html');
}

export function plural(number: number, word: string, prepend = true): string {
  const suffix = number !== 1 ? 's' : '';
  const justTheWord = word + suffix;
  return prepend ? `${number} ${justTheWord}` : justTheWord;
}

export function shortenCount(cnt: number): string {
  if (cnt < 1e4) {
    return cnt.toString();
  }

  return (
    cnt < 1e6
      ? `${Math.round(cnt / 1e3)}k`
      : `${Math.round(cnt / 1e6)}m`
  );
}

export function createTab(url: string): void {
  chrome.windows.getCurrent((currentWindow) => {
    if (currentWindow != null) {
      chrome.tabs.create({ url });
    } else {
      chrome.windows.create({
        url,
        focused: true,
      });
    }
  });
}

export function normalizeNumeric(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }

  if (value === '') return 0;

  return parseInt(value, 10);
}

export function broaderArrayIncludes<T>(array: T[] | readonly T[], value: string): boolean {
  return (array as unknown as string[]).includes(value);
}

export function isRgbArray(array: number[]): array is [number, number, number] {
  return array.length === 3;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const each = <T extends object>(
  obj: T,
  callback: <K extends keyof T & string>(key: string, value: T[K]) => void,
): void => {
  Object.keys(obj).forEach((key) => callback(key, obj[key]));
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const eachStrict = <T extends object>(
  obj: T,
  callback: <K extends keyof T>(key: K, value: T[K]) => void,
): void => {
  Object.keys(obj).forEach((key) => callback(key as keyof T, obj[key]));
};

export function createThemeLinkTag(): HTMLLinkElement {
  const el = document.createElement('link');
  el.setAttribute('rel', 'stylesheet');
  document.head.appendChild(el);
  return el;
}

export function executeAction<A extends ExtensionAction>(
  action: A,
  data?: ExtensionActionData[A],
): Promise<ExtensionActionResponses[A]> {
  const message = data ? { action, data } : { action };
  if (isFirefox) {
    return browser.runtime.sendMessage(message);
  }

  return new Promise((res) => {
    chrome.runtime.sendMessage(message, res);
  });
}

// Make the first letter of the first or all word(s) uppercase
export const capitalize = (str: string): string => (str.length === 1
  ? str.toUpperCase()
  : str[0].toUpperCase() + str.substring(1));

export function processInputChangeEvent(el: EventTarget): {
  name: keyof ExtensionOptions;
  value: ExtensionOptions[keyof ExtensionOptions];
} {
  const nodeName = (el as HTMLElement)?.nodeName.toLowerCase();
  let name: keyof ExtensionOptions;
  let value: ExtensionOptions[typeof name];
  switch (nodeName) {
    case 'select': {
      const select = el as HTMLSelectElement;
      if (select.multiple) {
        value = Array.from(select.selectedOptions).map((option) => option.value || option.innerText);
      }
    }
    // eslint-disable-next-line no-fallthrough
    case 'input': {
      const input = el as HTMLInputElement;
      name = input.name as keyof ExtensionOptions;
      if (typeof value === 'undefined') {
        switch (input.type) {
          case 'checkbox':
            value = input.checked;
            break;
          case 'number':
            value = parseInt(input.value, 10);
            break;
          default:
            value = input.value;
        }
      }
    }
  }

  return { value, name };
}

export const secondsElapsedSince = (date?: Date): number =>
  (typeof date !== 'undefined' ? (Date.now() - date.getTime()) / 1e3 : 0);
