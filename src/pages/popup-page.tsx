import { PopupIconList } from '../components/popup/PopupIconList.js';
import { SignInStatus } from '../components/popup/SignInStatus.js';
import { ExtensionAction } from '../extension-action.js';
import { createThemeLinkTag, executeAction } from '../utils.js';
import { h, render } from '../vendor/preact.js';

const $popupIcons = document.getElementById('popup-icons');
const $signInStatus = document.getElementById('sign-in-status');
const $version = document.getElementById('version');
const $options = document.getElementById('options');
const $themeLink = createThemeLinkTag();

render(<SignInStatus />, $signInStatus);

$options.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

executeAction(ExtensionAction.GET_POPUP_DATA)
  .then((response) => {
    $version.innerText = `v${response.version}`;
    $themeLink.href = `css/theme-${response.theme}.css`;
    if (response.signedIn) {
      render(
        <SignInStatus
          signedIn={response.signedIn}
          username={response.username}
          domain={response.prefs.preferredDomain}
        />,
        $signInStatus,
      );

      render(<PopupIconList {...response} />, $popupIcons);
    } else {
      render(<PopupIconList />, $popupIcons);

      render(<SignInStatus signedIn={false} />, $signInStatus);
    }
    $signInStatus.classList.remove('hidden');
  });
