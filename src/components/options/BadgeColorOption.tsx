import type { JSX } from 'preact';
import { ExtensionOptions, OptionsFieldNames, VFC } from '../../common-types.js';
import { DEFAULT_OPTIONS } from '../../common.js';
import { useCallback, useRef, h } from '../../vendor/preact.js';
import { FieldErrors } from './FieldErrors.js';

const COLOR_PALETTE = [
  '#000000',
  DEFAULT_OPTIONS.badgeColor,
  '#00d38f',
  '#0088ff',
  '#00aa00',
  '#ee8800',
  '#dd0000',
  '#ee00ee',
  '#8800ff',
];

interface PropTypes {
  value: ExtensionOptions['badgeColor'];
  errors: Record<string, string[]>;
  onChange: JSX.GenericEventHandler<HTMLElement>;
}

export const BadgeColorOption: VFC<PropTypes> = ({ value, errors, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const selectPreset: JSX.MouseEventHandler<HTMLSpanElement> = useCallback((e) => {
    if (!inputRef.current) return;

    inputRef.current.value = (e.target as HTMLSpanElement).title;
    inputRef.current.dispatchEvent(new Event('change'));
  }, []);

  return (
    <div className="field">
      <label htmlFor="badgeColor">Counter background color</label>
      <input
        type="color"
        name={OptionsFieldNames.BADGE_COLOR}
        id="badgeColor"
        value={value}
        onChange={onChange}
        ref={inputRef}
      />
      <div className="fieldlabel">
        Presets:&nbsp;
        {COLOR_PALETTE.map((color) => (
          <span
            key={color}
            className={`color-preset${color === value ? ' current' : ''}`}
            title={color}
            style={{ backgroundColor: color }}
            onClick={selectPreset}
          />
        ))}
      </div>
      <FieldErrors errors={errors} field={OptionsFieldNames.BADGE_COLOR} />
    </div>
  );
};
