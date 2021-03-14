import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  value: ExtensionOptions['notifSound'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const NotificationSoundOption: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <div className="field">
    <input
      type="checkbox"
      name={OptionsFieldNames.NOTIF_SOUND}
      id="notifSound"
      value="true"
      checked={value}
      onChange={onChange}
    />
    <label htmlFor="notifSound">Play a sound when the total item counter increases</label>
    <FieldErrors errors={errors} field={OptionsFieldNames.NOTIF_SOUND} />
  </div>
);
