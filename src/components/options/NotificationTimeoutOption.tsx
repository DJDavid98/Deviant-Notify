import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  value: ExtensionOptions['notifTimeout'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const NotificationTimeoutOption: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <div className="field">
    <label htmlFor="notifTimeout">Clear notification after</label>
    <input
      type="number"
      className="input input-short"
      name={OptionsFieldNames.NOTIF_TIMEOUT}
      id="notifTimeout"
      min="0"
      step="1"
      value={value}
      onChange={onChange}
    />
    <label htmlFor="notifTimeout">seconds</label>
    <div className="fieldlabel">
      How long to wait before the notification is cleared automatically. <span className="no-firefox">Note that the
      action center in Windows 10 usually hides the initial toast sooner than this, what this controls is how long the
      notification will be visible in the action center itself.</span> Set this to <code>0</code> to make the
      notification persist until clicked or manually dismissed.
    </div>
    <FieldErrors errors={errors} field={OptionsFieldNames.NOTIF_TIMEOUT} />
  </div>
);
