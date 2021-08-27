import { StorageLocation, ExtensionActionData, ExtensionActionResponses, ExtensionOptions } from './common-types.js';
import { constructTotalMessagesRecord, isFirefox } from './common.js';
import { ExtensionAction } from './extension-action.js';

export function parseHtml(html: string): Document {
  return (new DOMParser()).parseFromString(html, 'text/html');
}

const pluralExceptionWords = new Set([
  'activity',
  'correspondence',
  'miscellaneous',
  'feedback',
]);

const pluralizeWord = (word: string, number: number) => {
  if (pluralExceptionWords.has(word.toLowerCase()) || number === 1) {
    return word;
  }

  if (/y$/.test(word)) {
    return word.replace(/y$/, 'ies');
  }

  return `${word}s`;
};

export function plural(number: number, word: string, prepend = true): string {
  const justTheWord = pluralizeWord(word, number);
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
  Object.keys(obj).forEach((key) => callback(key, obj[key as keyof T & string]));
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const eachStrict = <T extends object>(
  obj: T,
  callback: <K extends keyof T>(key: K, value: T[K]) => void,
): void => {
  Object.keys(obj).forEach((key) => callback(key as keyof T, obj[key as keyof T]));
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
    return browser.runtime.sendMessage(message).catch((e) => {
      if (e instanceof Error && e.message.includes('Receiving end does not exist.')) {
        return;
      }

      console.error(e);
    });
  }

  return new Promise((res) => {
    chrome.runtime.sendMessage(message, res);
  });
}

// Make the first letter of the first or all word(s) uppercase
export const capitalize = (str: string): string => (str.length === 1
  ? str.toUpperCase()
  : str[0].toUpperCase() + str.substring(1));

export function processInputChangeEvent(el: EventTarget | null): {
  name?: keyof ExtensionOptions;
  value?: ExtensionOptions[keyof ExtensionOptions];
} {
  if (el === null) return {};

  const nodeName = (el as HTMLElement)?.nodeName.toLowerCase();
  let name: keyof ExtensionOptions | undefined;
  let value: ExtensionOptions[keyof ExtensionOptions] | undefined;
  switch (nodeName) {
    case 'select': {
      const select = el as HTMLSelectElement;
      if (select.multiple) {
        value = Array.from(select.selectedOptions)
          .map((option) => option.value || option.innerText);
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

export type NumberObject = { [k: string]: number | NumberObject };
export const recursiveSum = <T extends NumberObject>(obj: T | number | undefined): number => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'number' ? obj : 0;
  }

  return Object.keys(obj)
    .reduce((a, c) => a + (typeof obj[c] === 'number' ? obj[c] as number : recursiveSum(obj[c])), 0);
};

export const emptyNode = (node: Node): void => Array.from(node.childNodes)
  .forEach((child) => void node.removeChild(child));

export const isValidDate = (date?: Date): boolean => date instanceof Date && !Number.isNaN(date.getTime());

export const capNumberWithPlus = (n: number, max: number): string => `${n > max ? `${max}+` : n}`;

export const markAllNotifsRead = (): void =>
  void executeAction(ExtensionAction.SET_MARK_READ, constructTotalMessagesRecord(new Date()));

export const getItemsFromBrowserStorage = (
  storageKey: StorageLocation,
  key: string,
): Promise<Record<string, unknown>> => {
  if (isFirefox) {
    return browser.storage[storageKey].get(key);
  }

  return new Promise((res) => {
    chrome.storage[storageKey].get(key, (items) => {
      res(items);
    });
  });
};

export const setItemInBrowserStorage = (storageKey: StorageLocation, key: string, value: string): Promise<void> => {
  const updateObject = { [key]: value };

  if (isFirefox) {
    return browser.storage[storageKey].set(updateObject);
  }

  return new Promise((res) => {
    chrome.storage[storageKey].set(updateObject, () => res());
  });
};

export const removeItemFromBrowserStorage = (storageKey: StorageLocation, key: string): Promise<void> => {
  if (isFirefox) {
    return browser.storage[storageKey].remove(key);
  }

  return new Promise((res) => {
    chrome.storage[storageKey].remove(key, () => res());
  });
};
