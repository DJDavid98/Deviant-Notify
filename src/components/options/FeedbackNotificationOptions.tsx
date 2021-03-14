import type { JSX } from 'preact';
import { ExtensionOptions, FeedbackMessageTypes, OptionsFieldNames, VFC } from '../../common-types.js';
import { VALID_FEEDBACK_MESSAGE_TYPES } from '../../common.js';
import { h } from '../../vendor/preact.js';
import { NotificationTypeOptions } from './NotificationTypeOptions.js';

const feedbackMessageTypeReadableNames: Record<FeedbackMessageTypes, string> = {
  comments: 'Comments',
  replies: 'Replies',
  mentions: 'Mentions',
  activity: 'Activity',
  correspondence: 'Correspondence',
};

export interface PropTypes {
  value: ExtensionOptions['feedbackDisabled'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const FeedbackNotificationOptions: VFC<PropTypes> = ({ value, errors, onChange }) => (
  <NotificationTypeOptions
    icon="bell"
    type="feedback"
    value={value}
    errors={errors}
    onChange={onChange}
    errorKey={OptionsFieldNames.FEEDBACK_DISABLED}
    inputName={OptionsFieldNames.FEEDBACK_ENABLED}
    readableNameMap={feedbackMessageTypeReadableNames}
    validValues={VALID_FEEDBACK_MESSAGE_TYPES}
  />
);
