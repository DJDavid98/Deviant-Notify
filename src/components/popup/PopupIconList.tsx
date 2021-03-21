import { TotalMessageCounts, VFC } from '../../common-types.js';
import { ExtensionAction } from '../../extension-action.js';
import { recursiveSum } from '../../utils.js';
import { Fragment, h } from '../../vendor/preact.js';
import { PopupIconItem } from './PopupIconItem.js';

export const PopupIconList: VFC<Partial<TotalMessageCounts>> = ({ messages = 0, feedback, watch }) => (
  <Fragment>
    <PopupIconItem iconName="chat" count={messages} clickAction={ExtensionAction.OPEN_MESSAGES_PAGE} />
    <PopupIconItem iconName="bell" count={recursiveSum(feedback)} clickAction={ExtensionAction.OPEN_NOTIFS_PAGE} />
    <PopupIconItem iconName="watch" count={recursiveSum(watch)} clickAction={ExtensionAction.OPEN_WATCH_PAGE} />
  </Fragment>
);
