import { OptionsManager } from './classes/options-manager.js';
import { ReadStateManager } from './classes/read-state-manager.js';
import { SignInError } from './classes/sign-in-error.js';
import {
  DiFiCallRequest,
  ExtensionReadStates,
  MessageCenterApiResponse,
  MessageCenterItemResult,
} from './common-types.js';
import { DEFAULT_READ_AT_TIMESTAMP, LINKS } from './common.js';
import { getCookieByName, request } from './data-fetching.js';
import { isValidDate } from './utils.js';

export class RequestUtils {
  private requestParams = {
    ui: '',
    id: '',
  };

  buildNewRequestParams(commands: DiFiCallRequest | DiFiCallRequest[]): FormData {
    const timeInBase36 = (new Date()).getTime()
      .toString(36);
    const iid = `${this.requestParams.id}-${timeInBase36}-1.0`;
    const data = new FormData();
    data.append('iid', iid);
    data.append('ui', this.requestParams.ui);
    data.append('mp', '2');
    data.append('t', 'json');
    /** @type {DiFiCallRequest[]} */
    const commandArray = Array.isArray(commands) ? commands : [commands];
    commandArray.forEach((command) => {
      data.append(
        'c[]',
        [command.class, command.method, command.args]
          .map((s) => JSON.stringify(s))
          .join(','),
      );
    });
    return data;
  }

  async updateParams(existingPageData: string | null = null): Promise<void> {
    const pageData: string = existingPageData
      || await request(LINKS.lightUrl).then((r) => r.text());
    const startIndex = pageData.indexOf('window.__HEADER__INIT__');
    if (startIndex === -1) {
      throw new Error('Could not find start of header init data');
    }
    const endIndex = pageData.indexOf('window.__URL_CONFIG__');
    if (endIndex === -1) {
      throw new Error('Could not find end of header init data');
    }
    const relevantPageData = pageData.substring(startIndex, endIndex);
    const requestIdMatch = relevantPageData.match(/requestId:\s*"([a-z\d]+)"/i);
    if (requestIdMatch === null) {
      throw new Error('Could not find requestId in header init data');
    }
    [, this.requestParams.id] = requestIdMatch;

    const userInfoCookie = await getCookieByName('userinfo')
      .then((r) => (typeof r === 'object' && r !== null ? decodeURIComponent(r.value) : r));
    if (typeof userInfoCookie !== 'string') {
      throw new SignInError();
    }
    this.requestParams.ui = userInfoCookie;
  }
}

export function makeURLFromPath(url: string, options: OptionsManager): string {
  return `https://${options.get('preferredDomain')}${url}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMessageCenterApiResponse(resp: any): resp is MessageCenterApiResponse {
  return typeof resp === 'object'
    && typeof resp.counts === 'object'
    && typeof resp.counts.total === 'number'
    && typeof resp.settings === 'object'
    && typeof resp.settings.type === 'string'
    && typeof resp.settings.stacked === 'boolean'
    && typeof resp.hasMore === 'boolean'
    && typeof resp.cursor === 'string'
    && typeof resp.results === 'object' && Array.isArray(resp.results);
}

export type CombinedMessageCenterResponses<K extends string = string> = [
    Record<K, number> | undefined,
    Record<K, number> | undefined
];

export async function combineMessageCenterApiRequests(
  read: ReadStateManager,
  mainKey: keyof ExtensionReadStates,
  urls: string[],
): Promise<CombinedMessageCenterResponses> {
  if (urls.length === 0) return {} as CombinedMessageCenterResponses;

  const promises: Promise<MessageCenterApiResponse<string, MessageCenterItemResult>>[] = urls.map((url) => (
    request(url)
      .then((r) => r.json())
  ));
  const responses = await Promise.all(promises)
    .catch((e) => {
      console.error('Failed to retrieve message center item count, see the error below');
      console.error(e);
    });

  if (!Array.isArray(responses)) return {} as CombinedMessageCenterResponses;

  return responses.reduce(
    (acc, response) => {
      if (isMessageCenterApiResponse(response)) {
        const { type } = response.settings;
        let readTimestamp = DEFAULT_READ_AT_TIMESTAMP;
        const mainReadDates = read.getAll()?.[mainKey];
        if (mainReadDates && !(mainReadDates instanceof Date)) {
          const readDate = (mainReadDates as Record<string, Date | null>)[type];
          if (readDate) {
            readTimestamp = readDate.getTime();
          }
        }
        const unreadCount = response.results.reduce((a, c) => {
          const tryDate = new Date(c.ts);
          if (isValidDate(tryDate) && tryDate.getTime() > readTimestamp) {
            return a + 1;
          }
          return a;
        }, 0);
        return [
          {
            ...acc[0],
            [type]: response.counts.total,
          },
          {
            ...acc[1],
            [type]: unreadCount,
          },
        ];
      }
      return acc;
    },
    [{}, {}] as CombinedMessageCenterResponses,
  );
}
