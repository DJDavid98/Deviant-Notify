import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { VALID_WATCH_MESSAGE_TYPES, WATCH_MESSAGE_TYPE_READABLE_NAMES } from '../../common.js';
import { h } from '../../vendor/preact.js';
import { NotificationTypeOptions } from './NotificationTypeOptions.js';

export interface PropTypes {
  value: ExtensionOptions['watchDisabled'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<EventTarget>;
}

export const WatchNotificationOptions: VFC<PropTypes> = (props) => (
  <NotificationTypeOptions
    icon="watch"
    type="watch"
    errorKey={OptionsFieldNames.WATCH_DISABLED}
    inputName={OptionsFieldNames.WATCH_ENABLED}
    readableNameMap={WATCH_MESSAGE_TYPE_READABLE_NAMES}
    validValues={VALID_WATCH_MESSAGE_TYPES}
    {...props}
  />
);
