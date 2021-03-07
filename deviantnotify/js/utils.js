/**
 * @param {string} html
 * @return {Document}
 */
export function parseHtml(html) {
	return (new DOMParser()).parseFromString(html, 'text/html');
}

/**
 * @param {number} number
 * @param {string} word
 * @return {string}
 */
export function plural(number, word) {
	const suffix = number !== 1 ? 's' : '';
	return `${number} ${word + suffix}`;
}

/**
 * @param {number} cnt
 * @return {string}
 */
export function shortenCount(cnt) {
	return cnt < 1e4
		? cnt.toString()
		: (
			cnt < 1e6
				? Math.round(cnt / 1e3) + 'k'
				: Math.round(cnt / 1e6) + 'm'
		);
}

/**
 * http://stackoverflow.com/questions/11867545#comment52204960_11868398
 *
 * @param {number} r
 * @param {number} g
 * @param {number}b
 * @return {number} ranging from 0 to 255 (inclusive)
 */
export function yiq(r, g, b) {
	return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}

/**
 * @param {string} url
 */
export function createTab(url) {
	chrome.windows.getCurrent(currentWindow => {
		if (currentWindow != null){
			chrome.tabs.create({ url });
		}
		else {
			return chrome.windows.create({
				url,
				'focused': true,
			});
		}
	});
}

