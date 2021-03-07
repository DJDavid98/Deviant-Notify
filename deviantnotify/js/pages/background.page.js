import { isFirefox, LINKS, NOTIF_ID } from '../common.js';
import { ErrorCollection } from '../error-colection.class.js';
import { Options } from '../options.class.js';
import { singleton } from '../singleton.js';
import {
	checkSiteData,
	makeURLFromPath,
	openMessagesPage,
	openNotificationsPage,
} from '../request-utils.js';

singleton.options.loadUserOptions().then(() => {
	checkSiteData();
});

chrome.runtime.onMessage.addListener((req, sender, resp) => {
	switch (req.action){
		case 'updateOptions':
			singleton.options.processOptions(req.data)
				.then(results => {
					let failed = results.filter(el => !el.status);
					if (failed.length){
						const errors = new ErrorCollection();
						failed.forEach(el => {
							errors.add(el.key, el.errors);
						});
						resp({
							status: false,
							errors: errors.getAll(),
						});
					}
					else {
						singleton.options.saveOptions();
						resp({ status: true });
					}
				});
			return true;
		case 'openSignInPage':
			chrome.tabs.create({ url: makeURLFromPath(LINKS.signInPage) });
			break;
		case 'getSelectors':
			resp({
				onlyDomain: singleton.options.get('preferredDomain'),
			});
			break;
		case 'onSiteUpdate':
			singleton.extension.setAutoThemeFromBodyClasses(req.data.theme);
			const lastCheck = singleton.extension.getLastCheck();
			// Check for new notifications & notes again if last check was over 30s ago
			const recheck = lastCheck instanceof Date && Date.now() - lastCheck.getTime() > 30e3;
			singleton.extension.restartUpdateInterval(recheck);
			break;
		case 'testMessage':
			const id = NOTIF_ID + '-Test';
			singleton.extension.clearNotif(id).then(() => {
				const prefs = new Options(singleton, req.data);
				const MAX = 256;
				const unread = {
					notifs: Math.round(Math.random() * MAX),
					messages: Math.round(Math.random() * MAX),
				};
				singleton.extension.notifyUser(prefs, unread, id);
			});
			break;
		case 'getPopupData':
			resp(singleton.extension.getPopupData());
			break;
		case 'getOptionsData':
			resp(singleton.extension.getOptionsData());
			break;
		case 'openNotifsPage':
			openNotificationsPage();
			break;
		case 'openMessagesPage':
			openMessagesPage();
			break;
		default:
			throw new Error(`No handler defined for action ${req.action}`);
	}
});

chrome.notifications.onButtonClicked.addListener((notifId, btnIndex) => {
	const { notifs, messages } = singleton.extension.getButtonIndexes(notifId);
	switch (btnIndex){
		case notifs:
			openNotificationsPage();
			break;
		case messages:
			openMessagesPage();
			break;
	}
	chrome.notifications.clear(notifId);
});

// Set a click handler for Firefox notifications
if (isFirefox)
	browser.notifications.onClicked.addListener(notifId => {
		browser.notifications.clear(notifId);
	});
