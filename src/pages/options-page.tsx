import { h, render } from '../vendor/preact.js';
import { isFirefox } from '../common.js';
import { OptionsForm } from '../components/options/OptionsForm.js';
import { ExtensionAction } from '../extension-action.js';
import { createThemeLinkTag, executeAction } from '../utils.js';

document.body.classList.add(isFirefox ? 'firefox' : 'chrome');

const $version = document.getElementById('version');
const $formTarget = document.getElementById('form-target');
const $themeLink = createThemeLinkTag();

const getOptionsData = () => {
  executeAction(ExtensionAction.GET_OPTIONS_DATA).then((data) => {
    $themeLink.href = `css/theme-${data.theme}.css`;
    $version.innerText = `v${data.version}`;

    render(<OptionsForm prefs={data.prefs} refresh={getOptionsData} />, $formTarget);
  });
};

getOptionsData();
