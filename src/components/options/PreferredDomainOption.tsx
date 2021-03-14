import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { VALID_DOMAINS } from '../../common.js';
import { h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  value: ExtensionOptions['preferredDomain'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const PreferredDomainOption: VFC<PropTypes> = ({ errors, value, onChange }) => {
  if (VALID_DOMAINS.length < 2) {
    return null;
  }

  return (
    <div className="field">
      <label htmlFor="preferredDomain">Preferred domain</label>
      <select
        className="input"
        name={OptionsFieldNames.PREFERRED_DOMAIN}
        id="preferredDomain"
        onChange={onChange}
      >
        {VALID_DOMAINS.map((domain) => (
          <option key={domain} selected={domain === value}>{domain}</option>
        ))}
      </select>
      <div className="fieldlabel">
        Choose the domain you're usually signed in on. You may be prompted for additional
        permissions after saving.
      </div>
      <FieldErrors errors={errors} field={OptionsFieldNames.PREFERRED_DOMAIN} />
    </div>
  );
};
