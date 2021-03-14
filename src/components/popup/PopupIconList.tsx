import { UnreadCounts, VFC } from '../../common-types.js';
import { ExtensionAction } from '../../extension-action.js';
import { Fragment, h } from '../../vendor/preact.js';
import { PopupIconItem } from './PopupIconItem.js';

export const PopupIconList: VFC<Partial<UnreadCounts>> = ({ messages = 0, notifs = 0, watch = 0 }) => (
  <Fragment>
    <PopupIconItem iconName="chat" count={messages} clickAction={ExtensionAction.OPEN_MESSAGES_PAGE} />
    <PopupIconItem iconName="bell" count={notifs} clickAction={ExtensionAction.OPEN_NOTIFS_PAGE} />
    <PopupIconItem iconName="watch" count={watch} clickAction={ExtensionAction.OPEN_WATCH_PAGE} />
  </Fragment>
);
