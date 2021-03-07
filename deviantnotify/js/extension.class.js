import {
	DEFAULT_OPTIONS,
	isFirefox,
	NOTIF_ID,
	NOTIFICATION_SOUND,
	VALID_DOMAINS,
	VALID_ICON_STYLES,
	VALID_THEMES,
} from './common.js';
import { plural, shortenCount } from './utils.js';
import { checkSiteData } from './request-utils.js';

export class Extension {
	constructor(scope) {
		this._scope = scope;
		this._unread = {
			notifs: 0,
			messages: 0,
		};
		this._buttonIndexes = {
			[NOTIF_ID]: {
				notifs: -1,
				messages: -1,
			},
		};
		this._meta = {
			signedIn: false,
			username: '',
			autoTheme: VALID_THEMES[0],
		};
		this._clearNotifTimeout = {};
	}

	setNotifs(count) {
		this._unread.notifs = count === '' ? 0 : parseInt(count, 10);
	}

	setMessages(count) {
		this._unread.messages = count === '' ? 0 : parseInt(count, 10);
	}

	setSignedIn(bool) {
		this._meta.signedIn = bool;

		if (this._meta.signedIn)
			this.setBadgeSignedIn();
		else this.setBadgeSignedOut();
	}

	getSignedIn() {
		return this._meta.signedIn;
	}

	setUsername(string) {
		this._meta.username = string || '';
	}

	setAutoTheme(bodyDataThemeAttribute) {
		this._meta.autoTheme = bodyDataThemeAttribute.split('-')[0];
	}

	/**
	 * @param {Date} date
	 */
	setLastCheck(date) {
		this._meta.lastCheck = date;
	}

	/**
	 * @return {Date}
	 */
	getLastCheck() {
		return this._meta.lastCheck;
	}

	setAutoThemeFromBodyClasses(bodyClass) {
		let newValue = DEFAULT_OPTIONS.theme;
		if (bodyClass.includes('light-green')){
			newValue = 'green';
		}
		else {
			const mainThemeMatch = bodyClass.match(/theme-(light|dark)/);
			if (mainThemeMatch !== null){
				newValue = mainThemeMatch[1];
			}
		}
		this.setAutoTheme(newValue);
	}

	getPopupData() {
		return {
			notifs: this._unread.notifs,
			messages: this._unread.messages,
			signedIn: this._meta.signedIn,
			username: this._meta.username,
			version: chrome.runtime.getManifest().version,
			prefs: this._scope.options.getAll(),
			theme: this.getTheme(),
		};
	}

	getOptionsData() {
		return {
			prefs: this._scope.options.getAll(),
			version: chrome.runtime.getManifest().version,
			theme: this.getTheme(),
			validDomains: VALID_DOMAINS,
			validThemes: VALID_THEMES,
			validIconStyles: VALID_ICON_STYLES,
		};
	}

	getTheme(prefs = this._scope.options) {
		const setting = prefs.get('theme');
		if (setting === 'auto'){
			if (this._meta.autoTheme)
				return this._meta.autoTheme;
			throw new Error('Auto theme value not found');
		}

		return setting;
	}

	setBadgeText() {
		let value = this._unread.notifs + this._unread.messages;
		const newText = value === 0 ? '' : shortenCount(value);
		chrome.browserAction.getBadgeText({}, currentText => {
			if (currentText === newText)
				return;

			chrome.browserAction.setBadgeText({ text: newText });

			if (value === 0 || (!isNaN(currentText) && currentText > newText))
				return;

			this.notifyUser();
		});
	}

	notifyUser(prefs = this._scope.options, unread = this._unread, id = NOTIF_ID) {
		if (prefs.get('notifSound')){
			this.playNotifSound();
		}
		if (prefs.get('notifEnabled')){
			this.clearNotifTimeout(id);

			const params = this.buildNotifParams(prefs, unread, id);

			this.createNotif(prefs, params, id);
		}
	}

	buildNotifParams(prefs, unread, id = NOTIF_ID) {
		const buttons = [];
		const hasNotifs = unread.notifs > 0;
		const displayIcons = prefs.get('notifIcons');
		const bellStyle = prefs.get('bellIconStyle');
		const chatStyle = prefs.get('chatIconStyle');

		this._buttonIndexes[id] = {
			notifs: -1,
			messages: -1,
		};
		if (hasNotifs){
			buttons.push({
				title: 'View ' + plural(unread.notifs, 'Notification'),
				iconUrl: displayIcons ? (isFirefox ? '🔔' : `img/bell-${bellStyle}.svg`) : undefined,
			});
			this._buttonIndexes[id].notifs = 0;
		}
		if (unread.messages > 0){
			buttons.push({
				title: 'View ' + plural(unread.messages, 'Note'),
				iconUrl: displayIcons ? (isFirefox ? '📝' : `img/chat-${chatStyle}.svg`) : undefined,
			});
			this._buttonIndexes[id].messages = hasNotifs ? 1 : 0;
		}
		const persist = prefs.get('notifTimeout') === 0;

		const params = {
			type: 'basic',
			iconUrl: 'img/notif-128.png',
			title: 'DeviantArt',
			message: 'You have unread notifications',
		};

		if (!isFirefox){
			params.buttons = buttons;
			params.requireInteraction = persist;
			params.silent = true;
		}
		else {
			params.message += ':\n';
			buttons.forEach(btn => {
				params.message += '\n' + (displayIcons ? btn.iconUrl + '   ' : '') + btn.title.replace(/^View /, '');
			});
		}

		return params;
	}

	createNotif(prefs, params, id = NOTIF_ID) {
		const next = () => {
			if (!params.requireInteraction)
				this.setNotifTimeout(prefs, id);
		};
		if (isFirefox)
			browser.notifications.create(id, params).then(next);
		else chrome.notifications.create(id, params, next);
	}

	clearNotif(id = NOTIF_ID) {
		return new Promise(res => {
			chrome.notifications.clear(id, () => {
				delete this._clearNotifTimeout[id];
				res();
			});
		});
	}

	setBadgeSignedOut() {
		chrome.browserAction.setBadgeBackgroundColor({ color: '#222' });
		chrome.browserAction.setBadgeText({ text: '?' });
	}

	setBadgeSignedIn() {
		const color = this._scope.options.get('badgeColor');
		if (color)
			chrome.browserAction.setBadgeBackgroundColor({ color });
	}

	setBadgeColor() {
		chrome.browserAction.getBadgeText({}, ret => {
			if (ret === '?')
				return;

			this.setBadgeSignedIn();
		});
	}

	setNotifTimeout(prefs = this._scope.options, id = NOTIF_ID) {
		this._clearNotifTimeout[id] = setTimeout(() => {
			this.clearNotif(id);
		}, prefs.get('notifTimeout') * 1000);
	}

	clearNotifTimeout(id = NOTIF_ID) {
		if (typeof this._clearNotifTimeout[id] === 'number'){
			clearInterval(this._clearNotifTimeout[id]);
			delete this._clearNotifTimeout[id];
		}
	}

	restartUpdateInterval(recheck = true) {
		if (typeof this._updateInterval !== 'undefined')
			clearInterval(this._updateInterval);
		this._updateInterval = setInterval(checkSiteData, this._scope.options.get('updateInterval') * 60e3);
		if (recheck)
			checkSiteData();
	}

	getButtonIndexes(id = NOTIF_ID) {
		return this._buttonIndexes[id];
	}

	playNotifSound() {
		NOTIFICATION_SOUND.currentTime = 0;
		NOTIFICATION_SOUND.play();
	}
}
