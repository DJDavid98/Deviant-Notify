import type { JSX } from 'preact';
import { ExtensionOptions, VFC } from '../../common-types.js';
import { capitalize, plural } from '../../utils.js';
import { h } from '../../vendor/preact.js';
import { PopupIcon, PopupIconName } from '../popup/PopupIcon.js';
import { CtrlKey } from './CtrlKey.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  type: string;
  value: ExtensionOptions['watchDisabled'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
  validValues: readonly string[] | string[];
  readableNameMap: Record<string, string>;
  inputName: string;
  errorKey: string;
  icon?: PopupIconName;
}

// TODO Improve UX via custom UI for this (using checkboxes), select is just a placeholder for now
export const NotificationTypeOptions: VFC<PropTypes> = ({
  type,
  value,
  validValues,
  readableNameMap,
  inputName,
  errorKey,
  errors,
  onChange,
  icon,
}) => (
  <section className="notification-type-section">
    <h2>
      {icon && <PopupIcon name={icon} className="notification-type-section-icon" />}
      <span className="notification-type-section-title">{capitalize(type)} notifications</span>
    </h2>

    <div id={`${type}-enabled`} className="notification-type-options">
      <div className="col-auto">
        <select
          multiple
          name={inputName}
          onChange={onChange}
        >
          {validValues.map((validValue: string) => (
            <option key={validValue} value={validValue} selected={!value.includes(validValue)}>
              {plural(0, readableNameMap[validValue], false)}
            </option>
          ))}
        </select>
      </div>
      <div className="col">
        <p>Here you can choose which types of {type} notifications to include in the count.</p>
        <p>
          Hold down <CtrlKey /> to toggle individual items.
          Only highlighted items will be checked and become part of the total {type} item count.
        </p>
        <p>Tracking of {type} items will be disabled entirely if no types are selected.</p>
      </div>
    </div>
    <FieldErrors errors={errors} field={errorKey} />
  </section>
);
