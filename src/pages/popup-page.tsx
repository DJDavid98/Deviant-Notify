import { ExtensionActionResponses, PopupData } from '../common-types.js';
import { PopupContent } from '../components/popup/PopupContent.js';
import { PopupFooter } from '../components/popup/PopupFooter.js';
import { PopupIconList } from '../components/popup/PopupIconList.js';
import { ExtensionAction } from '../extension-action.js';
import { createThemeLinkTag, emptyNode, executeAction } from '../utils.js';
import { h, render } from '../vendor/preact.js';

const $popupIcons = document.getElementById('popup-icons');
const $content = document.getElementById('content');
const $version = document.getElementById('version');
const $dynamicFooter = document.getElementById('dynamic-footer');
const $themeLink = createThemeLinkTag();

const renderPage = (response: PopupData) => {
  if ($version) $version.innerText = `v${response.version}`;
  $themeLink.href = `css/theme-${response.theme}.css`;
  if ($popupIcons) render(<PopupIconList {...response} />, $popupIcons);
  if ($content) {
    emptyNode($content);
    render(<PopupContent {...response} />, $content);
  }
  if ($dynamicFooter) render(<PopupFooter {...response} />, $dynamicFooter);
};

executeAction(ExtensionAction.GET_POPUP_DATA).then(renderPage);

chrome.runtime.onMessage.addListener((req) => {
  const { action, data } = req;
  if (action === ExtensionAction.BROADCAST_POPUP_UPDATE) {
    renderPage(data as ExtensionActionResponses[ExtensionAction.BROADCAST_POPUP_UPDATE]);
  }
});
