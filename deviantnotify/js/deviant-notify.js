(() => {
  // Avoid re-sending data from a cached page
  if (!!window.performance && window.performance.getEntriesByType('navigation')[0].type === 'back_forward') return;

  const isFirefox = 'browser' in window;
  const qs = (s) => document.querySelector(s);
  const scheduleUpdate = () => {
    // Update auto theme setting value on page load
    const callback = (resp) => {
      if (resp.onlyDomain !== window.location.host) return;

      const data = {
        bodyClass: qs('body').className,
      };

      chrome.runtime.sendMessage({ action: 'onSiteUpdate', data });
    };

    if (!isFirefox) {
      chrome.runtime.sendMessage({ action: 'getSelectors' }, callback);
    } else {
      browser.runtime.sendMessage({ action: 'getSelectors' }).then(callback);
    }
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
