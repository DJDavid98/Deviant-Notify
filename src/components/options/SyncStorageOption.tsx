import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  value: ExtensionOptions['notifSound'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const SyncStorageOption: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <div className="field">
    <input
      type="checkbox"
      name={OptionsFieldNames.SYNC_STORAGE}
      id={OptionsFieldNames.SYNC_STORAGE}
      value="true"
      checked={value}
      onChange={onChange}
    />
    <label htmlFor={OptionsFieldNames.SYNC_STORAGE}>Synchronize read state across devices</label>
    <FieldErrors errors={errors} field={OptionsFieldNames.SYNC_STORAGE} />
  </div>
);
