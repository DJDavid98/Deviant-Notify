import { VFC } from '../../common-types.js';
import { VALID_ICON_STYLES } from '../../common.js';
import { h } from '../../vendor/preact.js';

export type PopupIconName = keyof typeof VALID_ICON_STYLES;

/* eslint-disable max-len */
const SVG_PATH_DEFINITIONS: Record<PopupIconName, string> = {
  chat: 'M19.914 4a1 1 0 011 1v12.586a1 1 0 01-.293.707l-1.414 1.414A1 1 0 0118.5 20h-15a.5.5 0 01-.5-.5 1 1 0 01.4-.8L5 17.5l.02-11.089a1 1 0 01.29-.703l1.396-1.411A1 1 0 017.417 4h12.497zM9 11a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z',
  bell: 'M15 19a2 2 0 01-2 2h-2a2 2 0 01-2-2h6zM13 2a1 1 0 011 1v1h2.656c.429 0 .835.41.907.917L19 13l1.707 1.707a1 1 0 01.293.707V17a1 1 0 01-1 1H4a1 1 0 01-1-1v-1.586a1 1 0 01.293-.707L5 13l1.437-8.083C6.51 4.41 6.915 4 7.344 4H10V3a1 1 0 011-1h2z',
  watch: 'M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
};
/* eslint-enable max-len */

export const PopupIcon: VFC<{ name: PopupIconName; className: string }> = ({ name, className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d={SVG_PATH_DEFINITIONS[name]} />
  </svg>
);
