import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { h } from '../../vendor/preact.js';

export interface PropTypes {
    value: ExtensionOptions['betaNotificationsSupport'];
}

export const BetaNotificationSupportOption: VFC<PropTypes> = ({ value }) => (
    <div className="field">
        <input
            type="checkbox"
            name={OptionsFieldNames.BETA_NOTIFICATIONS_SUPPORT}
            id={OptionsFieldNames.BETA_NOTIFICATIONS_SUPPORT}
            value="true"
            checked={value}
            disabled
        />
        <label htmlFor={OptionsFieldNames.BETA_NOTIFICATIONS_SUPPORT}>
            Account participating in the{' '}
            <strong>Notifications<small><sup>BETA</sup></small></strong>
            {' '}(automatically detected)
        </label>
    </div>
);
