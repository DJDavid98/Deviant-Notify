import { isFirefox } from './common.js';

function domainPermissionCallback(result, res, rej) {
	if (result)
		res();
	else rej();
}

function domainPermissionAction(domain, action) {
	const perm = { origins: [`https://${domain}/`] };

	if (isFirefox)
		return browser.permissions[action](perm)
			.then(result => {
				return new Promise((res, rej) => {
					domainPermissionCallback(result, res, rej);
				});
			});

	return new Promise((res, rej) => {
		chrome.permissions[action](perm, result => {
			domainPermissionCallback(result, res, rej);
		});
	});
}

export const checkDomainPermissions = domain => domainPermissionAction(domain, 'contains');
export const requestDomainPermission = domain => domainPermissionAction(domain, 'request');
export const removeDomainPermission = domain => domainPermissionAction(domain, 'remove');
