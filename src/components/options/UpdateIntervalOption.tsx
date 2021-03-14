import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { plural } from '../../utils.js';
import { h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  value: ExtensionOptions['updateInterval'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const UpdateIntervalOption: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <div className="field">
    <label htmlFor="updateInterval">Update counters every</label>
    <input
      type="number"
      className="input input-short"
      name={OptionsFieldNames.UPDATE_INTERVAL}
      id="updateInterval"
      min="1"
      step="1"
      value={value}
      onChange={onChange}
    />
    <label htmlFor="updateInterval">{plural(value, 'minute', false)}</label>
    <FieldErrors errors={errors} field={OptionsFieldNames.UPDATE_INTERVAL} />
  </div>
);
