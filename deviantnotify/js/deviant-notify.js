(function() {

	'use strict';

	// Avoid re-sending data from a cached page
	if (!!window.performance && window.performance.getEntriesByType('navigation')[0].type === 'back_forward')
		return;

	const isFirefox = 'browser' in window;
	const qs = s => document.querySelector(s);

	const callback = resp => {
		if (resp.onlyDomain !== location.host)
			return;

		const data = {
			theme: qs('body').className,
		};

		chrome.runtime.sendMessage({ action: 'onSiteUpdate', data });
	};

	if (!isFirefox)
		chrome.runtime.sendMessage({ action: 'getSelectors' }, callback);
	else browser.runtime.sendMessage({ action: 'getSelectors' }).then(callback);

})();
