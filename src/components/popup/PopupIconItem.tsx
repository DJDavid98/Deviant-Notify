import { VFC } from '../../common-types.js';
import { ExtensionAction } from '../../extension-action.js';
import { executeAction } from '../../utils.js';
import { h } from '../../vendor/preact.js';
import { PopupIcon, PopupIconName } from './PopupIcon.js';

interface PropTypes {
  count: number;
  iconName: PopupIconName;
  clickAction: ExtensionAction
}

export const PopupIconItem: VFC<PropTypes> = ({ clickAction, count, iconName }: PropTypes) => (
  <div className={`icon-link${count === 0 ? ' inactive' : ''}`} onClick={() => executeAction(clickAction)}>
    <PopupIcon className="icon-image" name={iconName} />
    {count > 0 && (
      <span className="icon-count">{count}</span>
    )}
  </div>
);
