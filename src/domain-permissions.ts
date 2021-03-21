import { isFirefox } from './common.js';

function domainPermissionCallback(result: boolean, res: VoidFunction, rej: VoidFunction) {
  if (result) { res(); } else rej();
}

function domainPermissionAction(domain: string, action: 'contains' | 'request' | 'remove'): Promise<void> {
  const perm = { origins: [`https://${domain}/`] };

  if (isFirefox) {
    return browser.permissions[action](perm)
      .then((result) => new Promise((res, rej) => {
        domainPermissionCallback(result, res, rej);
      }));
  }

  return new Promise((res, rej) => {
    chrome.permissions[action](perm, (result) => {
      domainPermissionCallback(result, res, rej);
    });
  });
}

export const checkDomainPermissions = (domain: string): Promise<void> => domainPermissionAction(domain, 'contains');
export const requestDomainPermission = (domain: string): Promise<void> => domainPermissionAction(domain, 'request');
export const removeDomainPermission = (domain: string): Promise<void> => domainPermissionAction(domain, 'remove');
