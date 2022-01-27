import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { FEEDBACK_MESSAGE_TYPE_READABLE_NAMES, VALID_FEEDBACK_MESSAGE_TYPES } from '../../common.js';
import { h, Fragment, useMemo } from '../../vendor/preact.js';
import { NotificationTypeOptions } from './NotificationTypeOptions.js';
import { NotificationsBeta } from '../NotificationsBeta.js';

export interface PropTypes {
  aggregateOnly: boolean;
  value: ExtensionOptions['feedbackDisabled'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<EventTarget>;
}

export const FeedbackNotificationOptions: VFC<PropTypes> = ({ aggregateOnly, ...props }) => {
  const validValues = useMemo(
    () => VALID_FEEDBACK_MESSAGE_TYPES.filter((item) => {
      const isAggregate = item === 'aggregate';
      return aggregateOnly ? isAggregate : !isAggregate;
    }),
    [aggregateOnly],
  );
  return (
    <Fragment>
      <NotificationTypeOptions
        icon="bell"
        type="feedback"
        errorKey={OptionsFieldNames.FEEDBACK_DISABLED}
        inputName={OptionsFieldNames.FEEDBACK_ENABLED}
        readableNameMap={FEEDBACK_MESSAGE_TYPE_READABLE_NAMES}
        validValues={validValues}
        {...props}
      />
      {aggregateOnly && <p className="limited-options">The available options for <NotificationsBeta /> users are
        currently limited.</p>}
    </Fragment>
  );
};
