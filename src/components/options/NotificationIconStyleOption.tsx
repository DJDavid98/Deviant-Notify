import type { JSX } from 'preact';
import { ExtensionOptions, VFC } from '../../common-types.js';
import { VALID_ICON_STYLES } from '../../common.js';
import { capitalize } from '../../utils.js';
import { Fragment, h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

export interface PropTypes {
  options: Pick<ExtensionOptions, `${keyof typeof VALID_ICON_STYLES}IconStyle`>;
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const NotificationStyleOptions: VFC<PropTypes> = ({ options, errors, onChange }) => (
  <div className="field" id="notifIconStyleSection">
    {Object.keys(VALID_ICON_STYLES).map((iconName: keyof typeof VALID_ICON_STYLES) => {
      const styles = VALID_ICON_STYLES[iconName];
      const groupName: keyof ExtensionOptions = `${iconName}IconStyle` as const;
      return (
        <Fragment key={groupName}>
          <div className="fancy-radio">
            {styles.map((style) => {
              const title = `${capitalize(style)} ${capitalize(iconName)}`;
              return (
                <label
                  key={style}
                  className={style === 'black' ? 'dark' : 'light'}
                  title={title}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={style}
                    checked={style === options[groupName]}
                    onChange={onChange}
                  />
                  <img src={`img/${iconName}-${style}.svg`} alt={title} />
                </label>
              );
            })}
          </div>
          <FieldErrors errors={errors} field={groupName} />
        </Fragment>);
    })}
  </div>
);
