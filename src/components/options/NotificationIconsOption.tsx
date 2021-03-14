import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { isFirefox } from '../../common.js';
import { h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  value: ExtensionOptions['notifIcons'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const NotificationIconsOption: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <div className="field">
    <input
      type="checkbox"
      name={OptionsFieldNames.NOTIF_ICONS}
      id="notifIcons"
      value="true"
      checked={value}
      onChange={onChange}
    />
    <label htmlFor="notifIcons">
      Display {isFirefox ? 'emoji' : 'button icons'}
    </label>
    <div className="fieldlabel">
      This lets you turn off the {isFirefox ? 'emoji' : 'icons'} inside the notifications.
    </div>
    <FieldErrors errors={errors} field={OptionsFieldNames.NOTIF_ICONS} />
  </div>
);
