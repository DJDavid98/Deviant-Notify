import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { FEEDBACK_MESSAGE_TYPE_READABLE_NAMES, VALID_FEEDBACK_MESSAGE_TYPES } from '../../common.js';
import { h } from '../../vendor/preact.js';
import { NotificationTypeOptions } from './NotificationTypeOptions.js';

export interface PropTypes {
  value: ExtensionOptions['feedbackDisabled'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<EventTarget>;
}

export const FeedbackNotificationOptions: VFC<PropTypes> = (props) => (
  <NotificationTypeOptions
    icon="bell"
    type="feedback"
    errorKey={OptionsFieldNames.FEEDBACK_DISABLED}
    inputName={OptionsFieldNames.FEEDBACK_ENABLED}
    readableNameMap={FEEDBACK_MESSAGE_TYPE_READABLE_NAMES}
    validValues={VALID_FEEDBACK_MESSAGE_TYPES}
    {...props}
  />
);
