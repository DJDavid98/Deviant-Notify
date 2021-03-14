// THIS IS A CONTENT SCRIPT - DO NOT IMPORT MODULES HERE
(() => {
  // Avoid re-sending data from a cached page
  if (window.performance) {
    const firstEntry = window.performance.getEntriesByType('navigation')[0];
    if (((firstEntry as unknown as { type: string }).type || firstEntry.entryType) === 'back_forward') return;
  }

  const ACTIONS = {
    GET_SELECTORS: 'getSelectors',
    ON_SITE_UPDATE: 'onSiteUpdate',
  };

  const isFirefox = 'browser' in window;
  const sendMessage = (action: string) => new Promise((res) => void (
    isFirefox ? browser.runtime.sendMessage({ action }).then(res) : chrome.runtime.sendMessage({ action }, res)
  ));
  const scheduleUpdate = (): void => {
    // Update auto theme setting value on page load
    sendMessage(ACTIONS.GET_SELECTORS)
      .then((resp: unknown) => {
        if (
          typeof resp === 'object'
          && 'onlyDomain' in resp
          && (resp as { onlyDomain: string }).onlyDomain !== window.location.host) {
          return;
        }

        const data = {
          bodyClass: document.body.className,
        };

        chrome.runtime.sendMessage({
          action: ACTIONS.ON_SITE_UPDATE,
          data,
        });
      });
  };

  window.requestAnimationFrame(scheduleUpdate);

  const delegateListener = (el, elementSelector, eventName, handler) => {
    el.addEventListener(eventName, (e) => {
      // loop parent nodes from the target to the delegation node
      for (let { target } = e; target && target !== el; target = target.parentNode) {
        if (target.matches(elementSelector)) {
          handler(e);
          break;
        }
      }
    }, false);
  };

  // Schedule updates to the 'auto' theme option when changed on-site
  const userMenu = document.getElementById('site-header-user-menu');
  delegateListener(userMenu, 'span[title$="Theme"]', 'click', scheduleUpdate);
})();
