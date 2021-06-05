import { OptionsManager } from './classes/options-manager.js';
import { ReadStateManager } from './classes/read-state-manager.js';
import {
  ApiConsoleResponse,
  ExtensionReadStates,
  MessageCenterApiResponse,
  MessageCenterItemResult,
} from './common-types.js';
import { DEFAULT_READ_AT_TIMESTAMP, LINKS } from './common.js';
import { request } from './data-fetching.js';
import { isValidDate } from './utils.js';

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

export function requestApiConsole<T extends ApiConsoleResponse<unknown>>(
  endpoint: string,
  parameters?: Array<{ name: string; value: string }>,
): Promise<T> {
  const devConsoleParams = new FormData();
  devConsoleParams.append('endpoint', endpoint);
  devConsoleParams.append('params', JSON.stringify([
    ...(parameters || []),
    { name: 'with_session', value: 'false' },
    { name: 'da_version', value: '' },
    { name: 'mature_content', value: 'true' },
    { name: 'endpoint', value: endpoint },
  ]));

  return request(LINKS.consoleApiRequest, { method: 'POST', body: devConsoleParams }).then((r) => r.json());
}
