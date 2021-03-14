import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  value: ExtensionOptions['notifEnabled'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const NotificationEnabledOption: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <div className="field">
    <input
      type="checkbox"
      name={OptionsFieldNames.NOTIF_ENABLED}
      id="notifEnabled"
      value="true"
      checked={value}
      onChange={onChange}
    />
    <label htmlFor="notifEnabled">Enable desktop notifications</label>
    <FieldErrors errors={errors} field={OptionsFieldNames.NOTIF_ENABLED} />
  </div>
);
