export const isMac = typeof window.navigator.userAgent === 'string'
  && /(macos|iphone|os ?x|ip[ao]d)/i.test(window.navigator.userAgent);
