import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC, WatchMessageTypes } from '../../common-types.js';
import { VALID_WATCH_MESSAGE_TYPES } from '../../common.js';
import { Fragment, h } from '../../vendor/preact.js';
import { CtrlKey } from './CtrlKey.js';
import { FieldErrors } from './FieldErrors.js';

const watchMessageTypeReadableNames: Record<WatchMessageTypes, string> = {
  deviations: 'Deviations',
  groupDeviations: 'Group Deviations',
  journals: 'Posts',
  forums: 'Forums',
  polls: 'Polls',
  status: 'Status Updates',
  commissions: 'Commissions',
  misc: 'Miscellaneous',
};

export interface PropTypes {
  value: ExtensionOptions['watchDisabled'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const WatchNotificationOptions: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <Fragment>
    <h2>Watch notifications</h2>

    <div id="watch-enabled">
      <div className="col-auto">
        <select
          id="enabledWatchTypes"
          multiple
          name={OptionsFieldNames.WATCH_ENABLED}
          onChange={onChange}
        >
          {VALID_WATCH_MESSAGE_TYPES.map((type) => (
            <option key={type} value={type} selected={!value.includes(type)}>
              {watchMessageTypeReadableNames[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="col">
        <p>Here you can choose which types of watch notifications to include in the count.</p>
        <p>
          Hold down <CtrlKey /> to toggle individual items.
          Only highlighted items will be checked and become part of the total watch item count.
        </p>
        <p>Tracking of watched items will be disabled entirely if no types are selected.</p>
      </div>
    </div>
    <FieldErrors errors={errors} field={OptionsFieldNames.WATCH_DISABLED} />
  </Fragment>
);
