import type { JSX } from 'preact';
import { ExtensionOptions, OptionsData, VFC } from '../../common-types.js';
import { DEFAULT_OPTIONS, isFirefox, VALID_FEEDBACK_MESSAGE_TYPES, VALID_WATCH_MESSAGE_TYPES } from '../../common.js';
import { checkDomainPermissions, requestDomainPermission } from '../../domain-permissions.js';
import { ExtensionAction } from '../../extension-action.js';
import { executeAction, processInputChangeEvent } from '../../utils.js';
import {
  Fragment,
  h,
  useCallback,
  useEffect,
  useRef,
  useState,
} from '../../vendor/preact.js';
import { BadgeColorOption } from './BadgeColorOption.js';
import { FeedbackNotificationOptions } from './FeedbackNotificationOptions.js';
import { NotificationEnabledOption } from './NotificationEnabledOption.js';
import { NotificationIconsOption } from './NotificationIconsOption.js';
import { NotificationStyleOptions } from './NotificationIconStyleOption.js';
import { NotificationSoundOption } from './NotificationSoundOption.js';
import { NotificationTimeoutOption } from './NotificationTimeoutOption.js';
import { PreferredDomainOption } from './PreferredDomainOption.js';
import { SyncStorageOption } from './SyncStorageOption.js';
import { ThemeOption } from './ThemeOption.js';
import { UpdateIntervalOption } from './UpdateIntervalOption.js';
import { WatchNotificationOptions } from './WatchNotificationOptions.js';

interface PropTypes {
  prefs: OptionsData['prefs'];
  refresh: VoidFunction;
}

export const OptionsForm: VFC<PropTypes> = ({ prefs, refresh }) => {
  const [options, setOptions] = useState<ExtensionOptions>(prefs);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState<boolean | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setOptions(prefs);
  }, [prefs]);

  const testNotification = useCallback(() => {
    void executeAction(ExtensionAction.TEST_MESSAGE, options);
  }, [options]);

  const commitOptions = useCallback((newOptions: ExtensionOptions) => {
    executeAction(ExtensionAction.UPDATE_OPTIONS, newOptions)
      .then((response) => {
        setSubmitting(false);

        setErrors('errors' in response ? response.errors : {});

        if (response.status) {
          refresh();
        }
      });
  }, [refresh]);

  const handleSubmit: JSX.GenericEventHandler<EventTarget> = useCallback((e) => {
    e.preventDefault();
    setSubmitting(true);

    const requestPermission = () => {
      requestDomainPermission(options.preferredDomain)
        .then(() => {
          commitOptions(options);
        })
        .catch(() => {
          commitOptions({ ...options, preferredDomain: DEFAULT_OPTIONS.preferredDomain });
        });
    };

    if (isFirefox) {
      requestPermission();
      return;
    }

    checkDomainPermissions(options.preferredDomain)
      .then(() => {
        commitOptions(options);
      })
      .catch(requestPermission);
  }, [options, commitOptions]);

  const defaultChangeHandler: JSX.GenericEventHandler<EventTarget> = useCallback((e) => {
    const { name, value } = processInputChangeEvent(e.target);
    if (name) {
      setOptions({ ...options, [name]: value });
    }
  }, [options]);

  const watchEnabledChangeHandler: JSX.GenericEventHandler<EventTarget> = useCallback((e) => {
    const { name, value } = processInputChangeEvent(e.target);
    if (name) {
      const result = value as string[];
      const watchDisabled = VALID_WATCH_MESSAGE_TYPES.filter((validType) => !result.includes(validType));
      setOptions({ ...options, watchDisabled });
    }
  }, [options]);

  const feedbackEnabledChangeHandler: JSX.GenericEventHandler<EventTarget> = useCallback((e) => {
    const { name, value } = processInputChangeEvent(e.target);
    if (name) {
      const result = value as string[];
      const feedbackDisabled = VALID_FEEDBACK_MESSAGE_TYPES.filter((validType) => !result.includes(validType));
      setOptions({ ...options, feedbackDisabled });
    }
  }, [options]);

  return (
    <form id="options-form" ref={formRef} onSubmit={handleSubmit}>
      <div className="block-tab">
        <BadgeColorOption
          errors={errors}
          value={options.badgeColor}
          onChange={defaultChangeHandler}
        />

        <PreferredDomainOption
          errors={errors}
          value={options.preferredDomain}
          onChange={defaultChangeHandler}
        />

        <ThemeOption
          errors={errors}
          value={options.theme}
          onChange={defaultChangeHandler}
        />

        <UpdateIntervalOption
          errors={errors}
          value={options.updateInterval}
          onChange={defaultChangeHandler}
        />

        <NotificationSoundOption
          errors={errors}
          value={options.notifSound}
          onChange={defaultChangeHandler}
        />

        <SyncStorageOption
          errors={errors}
          value={options.useSyncStorage}
          onChange={defaultChangeHandler}
        />

        <FeedbackNotificationOptions
          errors={errors}
          value={options.feedbackDisabled}
          onChange={feedbackEnabledChangeHandler}
        />

        <WatchNotificationOptions
          errors={errors}
          value={options.watchDisabled}
          onChange={watchEnabledChangeHandler}
        />

        <fieldset>
          <legend>Desktop notification options</legend>

          <p>The desktop notification is displayed whenever the number of total items increases.</p>

          <NotificationEnabledOption
            errors={errors}
            value={options.notifEnabled}
            onChange={defaultChangeHandler}
          />

          <NotificationTimeoutOption
            errors={errors}
            value={options.notifTimeout}
            onChange={defaultChangeHandler}
          />

          <NotificationIconsOption
            errors={errors}
            value={options.notifIcons}
            onChange={defaultChangeHandler}
          />

          {!isFirefox && (
            <Fragment>
              <p className="field-pre">Select what color you prefer for the notification button icons.</p>

              <NotificationStyleOptions
                errors={errors}
                options={options}
                onChange={defaultChangeHandler}
              />
            </Fragment>
          )}
        </fieldset>
      </div>

      <div className="flex-actions">
        <div className="flex-save">
          <button className="button" id="submit-button" disabled={submitting === true}>Save</button>
          <p className={submitting === true ? undefined : 'hidden'} id="saving-settings">
            &nbsp;Saving settings&hellip;
          </p>
          <p className={submitting !== false ? 'hidden' : undefined} id="saved-settings">&nbsp;{
            Object.keys(errors).length > 0
              ? <strong style={{ color: 'red' }}>Failed to save</strong>
              : 'Saved.'
          }</p>
        </div>
        <div className="flex-test">
          <button type="button" className="button button-link" id="test-button" onClick={testNotification}>
            Test Notification
          </button>
        </div>
      </div>
    </form>
  );
};
