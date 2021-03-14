import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { VALID_THEMES } from '../../common.js';
import { capitalize } from '../../utils.js';
import { h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  value: ExtensionOptions['theme'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const ThemeOption: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <div className="field">
    <label htmlFor="theme">Theme</label>
    <select className="input" name={OptionsFieldNames.THEME} id="theme" onChange={onChange}>
      {VALID_THEMES.map((el) => (
        <option key={el} value={el} selected={el === value}>{capitalize(el)}</option>
      ))}
    </select>
    <div className="fieldlabel">
      Auto will try to keep the theme in sync with the one you have selected on the site.
    </div>
    <FieldErrors errors={errors} field={OptionsFieldNames.THEME} />
  </div>
);
