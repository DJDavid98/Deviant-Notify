import { OptionsManager } from './classes/options-manager.js';
import { SignInError } from './classes/sign-in-error.js';
import { DiFiCallRequest } from './common-types.js';
import { LINKS } from './common.js';
import { getCookieByName, request } from './data-fetching.js';

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
    /** @type {string} */
    const pageData = existingPageData || await request(LINKS.lightUrl)
      .then((r) => r.text());
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
      .then((r) => decodeURIComponent(r.value));
    if (typeof userInfoCookie !== 'string') {
      throw new SignInError();
    }
    this.requestParams.ui = userInfoCookie;
  }
}

export function makeURLFromPath(url: string, options: OptionsManager): string {
  return `https://${options.get('preferredDomain')}${url}`;
}
