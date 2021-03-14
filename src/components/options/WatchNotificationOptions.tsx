import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC, WatchMessageTypes } from '../../common-types.js';
import { VALID_WATCH_MESSAGE_TYPES } from '../../common.js';
import { h } from '../../vendor/preact.js';
import { NotificationTypeOptions } from './NotificationTypeOptions.js';

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
  <NotificationTypeOptions
    icon="watch"
    type="watch"
    value={value}
    errors={errors}
    onChange={onChange}
    errorKey={OptionsFieldNames.WATCH_DISABLED}
    inputName={OptionsFieldNames.WATCH_ENABLED}
    readableNameMap={watchMessageTypeReadableNames}
    validValues={VALID_WATCH_MESSAGE_TYPES}
  />
);
