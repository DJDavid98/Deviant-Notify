import { plural } from '../utils.js';
import { checkDomainPermissions, requestDomainPermission } from '../domain-permissions.js';
import { isFirefox } from '../common.js';
import { isMac } from '../is-mac.js';

$('body').addClass(isFirefox ? 'firefox' : 'chrome');

const watchMessageTypeReadableNames = {
  deviations: 'Deviations',
  groupDeviations: 'Group Deviations',
  journals: 'Posts',
  forums: 'Forums',
  polls: 'Polls',
  status: 'Status Updates',
  commissions: 'Commissions',
  misc: 'Miscellaneous',
};

// Convert .serializeArray() result to object
$.fn.mkData = function mkData(obj) {
  const $inputs = this.find(':input:valid');
  const data = {};
  $inputs.each((_, el) => {
    if (el.nodeName === 'BUTTON') {
      return;
    }

    if (el.nodeName === 'INPUT') {
      let { value } = el;
      switch (el.type) {
        case 'number':
          value = parseInt(value, 10);
          break;
        case 'checkbox':
          value = el.checked;
          break;
        case 'radio':
          if (!el.checked) {
            return;
          }
          break;
      }
      data[el.name] = value;
    } else if (el.name === 'watchEnabled') {
      const disabledOptions = [];
      $(el).find('option').each((i, opt) => {
        if (!opt.selected) {
          disabledOptions.push(opt.value);
        }
      });
      data.watchDisabled = disabledOptions;
    } else {
      const tempData = $(el)
        .serializeArray();
      data[tempData[0].name] = tempData[0].value;
    }
  });
  if (typeof obj === 'object') {
    $.extend(data, obj);
  }
  return data;
};

// Make the first letter of the first or all word(s) uppercase
$.capitalize = (str) => (str.length === 1 ? str.toUpperCase() : str[0].toUpperCase() + str.substring(1));

$.fn.hasAttr = function hasAttr(attr) {
  const el = this.get(0);
  return el && el.hasAttribute(attr);
};

// :valid pseudo polyfill
if (typeof $.expr[':'].valid !== 'function') {
  $.expr[':'].valid = (el) => (typeof el.validity === 'object' ? el.validity.valid : ((node) => {
    const $el = $(node);
    const pattern = $el.attr('pattern');
    const required = $el.hasAttr('required');
    const val = $el.val();
    if (required && (typeof val !== 'string' || !val.length)) {
      return false;
    }
    if (pattern) {
      return (new RegExp(pattern)).test(val);
    }
    return true;
  })(el));
}

const $version = $('#version');
const $form = $('#options-form');
const $submitButton = $('#submit-button');
const $savingSettings = $('#saving-settings');
const $savedSettings = $('#saved-settings');
const $testButton = $('#test-button');
const $badgeColor = $('#badgeColor');
const $preferredDomain = $('#preferredDomain');
const $updateInterval = $('#updateInterval');
const $notifEnabled = $('#notifEnabled');
const $notifSound = $('#notifSound');
const $notifTimeout = $('#notifTimeout');
const $notifIcons = $('#notifIcons');
const $notifIconStyleSection = $('#notifIconStyleSection');
const $theme = $('#theme');
const $enabledWatchTypes = $('#enabledWatchTypes');
const $themeLink = $(document.createElement('link')).attr('rel', 'stylesheet').appendTo('head');

function getOptionsData() {
  chrome.runtime.sendMessage({ action: 'getOptionsData' }, (response) => {
    $themeLink.attr('href', `css/theme-${response.theme}.css`);
    $version.text(`v${response.version}`);

    $badgeColor.val(response.prefs.badgeColor)
      .spectrum({
        color: response.prefs.badgeColor,
        showInput: true,
        preferredFormat: 'hex',
        allowEmpty: false,
        cancelText: 'close',
        chooseText: 'Set',
        showPalette: true,
        showSelectionPalette: false,
        palette: [
          '#000',
          '#3a4e27',
          '#00d38f',
          '#08f',
          '#0a0',
          '#e80',
          '#d00',
          '#e0e',
          '#80f',
        ].map((c) => [c]),
      });
    $updateInterval.val(response.prefs.updateInterval)
      .trigger('change');
    $notifEnabled.prop('checked', response.prefs.notifEnabled);
    $notifSound.prop('checked', response.prefs.notifSound);
    $notifIcons.prop('checked', response.prefs.notifIcons);
    $notifTimeout.val(response.prefs.notifTimeout);
    $preferredDomain.empty();
    $.each(response.validDomains, (_, el) => {
      $preferredDomain.append(
        $(document.createElement('option'))
          .attr('selected', el === response.prefs.preferredDomain)
          .text(el),
      );
    });
    $theme.empty();
    $.each(response.validThemes, (_, el) => {
      $theme.append(
        $(document.createElement('option'))
          .attr('value', el)
          .attr('selected', el === response.prefs.theme)
          .text($.capitalize(el)),
      );
    });
    $notifIconStyleSection.empty();
    $.each(response.validIconStyles, (iconName, styles) => {
      const $iconSelect = $(document.createElement('div'))
        .attr('class', 'fancy-radio');
      const groupName = `${iconName}IconStyle`;
      $.each(styles, (_, style) => {
        $iconSelect.append(
          $(document.createElement('label'))
            .attr({
              class: style === 'black' ? 'dark' : 'light',
              title: `${$.capitalize(style.replace(/-/g, ' '))} ${$.capitalize(iconName)}`,
            })
            .append(
              $(document.createElement('input'))
                .attr({
                  type: 'radio',
                  name: groupName,
                  value: style,
                })
                .prop({
                  checked: style === response.prefs[groupName],
                }),
              $(document.createElement('img'))
                .attr('src', `img/${iconName}-${style}.svg`),
            ),
        );
      });
      $notifIconStyleSection.append($iconSelect);
    });
    $enabledWatchTypes.empty();
    const { watchDisabled = [] } = response.prefs;
    response.validWatchMessageTypes.forEach((type) => {
      $enabledWatchTypes.append(
        $(document.createElement('option'))
          .attr('value', type)
          .prop('selected', !watchDisabled.includes(type))
          .text(watchMessageTypeReadableNames[type]),
      );
    });
  });
}

getOptionsData();

function sub(enable) {
  $submitButton.attr('disabled', !enable);
  $savingSettings[enable ? 'addClass' : 'removeClass']('hidden');
  if (enable) {
    $savedSettings.removeClass('hidden');
  } else {
    $savedSettings.addClass('hidden');
  }
}

function updateOptions(data) {
  chrome.runtime.sendMessage({
    action: 'updateOptions',
    data,
  }, (response) => {
    sub(true);

    $form.find('.error').remove();

    if (response.status) {
      getOptionsData();
    } else {
      $.each(response.errors, (key, errors) => {
        const $field = $(`#${key}`)
          .closest('.field');
        const $ul = $(document.createElement('ul'))
          .attr('class', 'error');
        errors.forEach((el) => {
          $ul.append(
            $(document.createElement('li'))
              .text(el),
          );
        });
        $field.append($ul);
      });
    }
  });
}

const $ctrlKeys = $('.kbd-ctrl');
$ctrlKeys.text(isMac ? '\u2318' : 'Ctrl');

const getFormData = () => $form.mkData();

$updateInterval.on('change', () => {
  const value = parseInt($updateInterval.val(), 10);
  $updateInterval.next()
    .text(plural(value, 'minute', false));
});

$form.on('submit', (e) => {
  e.preventDefault();
  sub(false);

  const data = getFormData();

  const requestPermission = () => {
    requestDomainPermission(data.preferredDomain)
      .then(() => {
        updateOptions(data);
      })
      .catch(() => {
        delete data.preferredDomain;
        updateOptions(data);
      });
  };

  if (isFirefox) {
    requestPermission();
    return;
  }

  checkDomainPermissions(data.preferredDomain)
    .then(() => {
      updateOptions(data);
    })
    .catch(requestPermission);
});
$testButton.on('click', (e) => {
  e.preventDefault();

  const data = getFormData();

  chrome.runtime.sendMessage({
    action: 'testMessage',
    data,
  });
});
