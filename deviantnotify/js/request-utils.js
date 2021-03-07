import { COOKIE_URL, isFirefox, LINKS } from './common.js';
import { singleton } from './singleton.js';
import { createTab, parseHtml } from './utils.js';

/**
 * @typedef DiFiResponse
 * @property {{ response: { calls: DiFiCall[], status: "SUCCESS" | "FAIL" } }} DiFi
 */

/**
 * @typedef DiFiCall
 * @property {DiFiCallRequest} request
 * @property {{ content: object }} response
 */

/**
 * @typedef DiFiCallRequest
 * @property {string[]} args
 * @property {string} class
 * @property {string} method
 */

export class NotSignedInError extends Error {
	constructor() {
		super('You are not signed in');
		this._code = 401;
	}

	get code() {
		return this._code;
	}
}

export class RequestUtils {
	constructor(scope) {
		this._scope = scope;
		/** @type {{ui: string, id: string}} */
		this._requestParams = {
			ui: '',
			id: '',
		};
	}

	/**
	 * @param {DiFiCallRequest|DiFiCallRequest[]} commands
	 * @return {FormData}
	 */
	buildNewRequestParams(commands) {
		const timeInBase36 = (new Date()).getTime().toString(36);
		const iid = `${this._requestParams.id}-${timeInBase36}-1.0`;
		const data = new FormData();
		data.append('iid', iid);
		data.append('ui', this._requestParams.ui);
		data.append('mp', '2');
		data.append('t', 'json');
		/** @type {DiFiCallRequest[]} */
		const commandArray = Array.isArray(commands) ? commands : [commands];
		commandArray.forEach(command => {
			data.append('c[]', [command.class, command.method, command.args].map(JSON.stringify).join(','));
		});
		return data;
	}

	/**
	 * @param {string} existingPageData
	 * @return {Promise<void>}
	 */
	async updateParams(existingPageData = null) {
		/** @type {string} */
		const pageData = existingPageData || await request(LINKS.lightUrl).then(r => r.text());
		const startIndex = pageData.indexOf('window.__HEADER__INIT__');
		if (startIndex === -1){
			throw new Error('Could not find start of header init data');
		}
		const endIndex = pageData.indexOf('window.__URL_CONFIG__');
		if (endIndex === -1){
			throw new Error('Could not find end of header init data');
		}
		const relevantPageData = pageData.substring(startIndex, endIndex);
		const requestIdMatch = relevantPageData.match(/requestId:\s*"([a-z\d]+)"/i);
		if (requestIdMatch === null){
			throw new Error('Could not find requestId in header init data');
		}
		this._requestParams.id = requestIdMatch[1];

		const userInfoCookie = await getCookieByName('userinfo').then(r => decodeURIComponent(r.value));
		if (typeof userInfoCookie !== 'string'){
			throw new NotSignedInError();
		}
		this._requestParams.ui = userInfoCookie;
	}
}

/**
 * @param {string} path
 * @param {RequestInit} params
 * @return {Promise<Response>}
 */
export function request(path, params = {}) {
	params.credentials = 'include';
	console.log(`Sending request to ${path} with parameters:`, params);
	return fetch(COOKIE_URL + path.substr(1), params);
}

/**
 * @param {string} name
 * @return {Promise<{
 *   domain: string,
 *   expirationDate: number,
 *   firstPartyDomain: string,
 *   hostOnly: boolean,
 *   httpOnly: boolean,
 *   name: string,
 *   path: string,
 *   sameSite: string,
 *   secure: boolean,
 *   session: boolean,
 *   storeId: string,
 *   value: string,
 * }>}
 */
export function getCookieByName(name) {
	return new Promise(res => {
		const getObject = {
			name,
			url: COOKIE_URL,
		};
		const handleCookie = existingCookie => {
			res(existingCookie);
		};
		if (isFirefox)
			browser.cookies.get(getObject).then(handleCookie);
		else chrome.cookies.get(getObject, handleCookie);
	});
}

/**
 * @return {Promise<number>}
 */
async function getNotificationCount() {
	const itemsPerRequest = 24;
	let feedItems = [];
	const recurse = async (cursor) => {
		const query = [
			`limit=${itemsPerRequest}`,
			cursor && `cursor=${encodeURIComponent(cursor)}`,
		].filter(Boolean).join('&');
		const path = `${LINKS.feedbackApi}?${query}`;
		const resp = await request(path, { redirect: "error" }).then(r => r.json());
		if (Array.isArray(resp.results)){
			feedItems = [...feedItems, ...resp.results];
		}
		if (resp.hasMore === true){
			await recurse(resp.cursor);
		}
	};
	await recurse();
	console.log('Got notification items:', feedItems);
	return feedItems.length;
}

/**
 * @return {Promise<number>}
 */
async function getMessageCount() {
	const data = singleton.reqUtils.buildNewRequestParams({
		class: 'DeveloperConsole',
		method: 'do_api_request',
		args: ['/notes/folders', []],
	});
	/** @type {DiFiResponse} */
	const result = await request(LINKS.difi, { method: 'POST', body: data }).then(r => r.json());

	const { results: folders } = result.DiFi.response.calls[0].response.content;

	if (Array.isArray(folders)) {
		const unreadFolder = folders.find(folder => folder.title === 'Unread');
		if (unreadFolder) {
			return parseInt(unreadFolder.count, 10);
		}
	}

	return 0;
}

export function checkSiteData() {
	request(LINKS.lightUrl)
		.catch(e => console.error('checkSiteData caught error', e))
		.then(resp => resp.text())
		.then(async resp => {
			singleton.extension.setLastCheck(new Date());
			const $page = $(parseHtml(resp));

			const uiCookie = await getCookieByName('userinfo');
			let signedIn = false;
			if (uiCookie && uiCookie.value) {
				const userInfo = JSON.parse(decodeURIComponent(uiCookie.value).replace(/^__[^;]+;/, ''));
				if (userInfo.username) {
					singleton.extension.setUsername(userInfo.username);
					signedIn = true;
				}
			}

			if (!signedIn) {
				singleton.extension.setSignedIn(false);
				return;
			}

			await singleton.reqUtils.updateParams(resp);

			let notifCount = 0, messageCount = 0;
			try {
				[notifCount, messageCount] = await Promise.all([
					getNotificationCount(),
					getMessageCount(),
				]);
			} catch (e) {
				console.error('Failed to get message counts', e);
			}

			// Placeholder
			singleton.extension.setNotifs(notifCount);
			singleton.extension.setMessages(messageCount);
			singleton.extension.setBadgeText();
			singleton.extension.setSignedIn(true);

			singleton.extension.setAutoThemeFromBodyClasses($page.find('body').attr('class'));
		});
}

/**
 * @param {string} url
 * @return {string}
 */
export function makeURLFromPath(url) {
	return `https://${singleton.options.get('preferredDomain')}${url}`;
}

export function openNotificationsPage() {
	createTab(makeURLFromPath(LINKS.notifs));
}

export function openMessagesPage() {
	createTab(makeURLFromPath(LINKS.messages));
}
