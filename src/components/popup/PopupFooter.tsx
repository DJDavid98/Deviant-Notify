import type { JSX } from 'preact';
import { PopupData, VFC } from '../../common-types.js';
import { ExtensionAction } from '../../extension-action.js';
import { executeAction } from '../../utils.js';
import { Fragment, h } from '../../vendor/preact.js';
import { LoadingIndicator } from './LoadingIndicator.js';
import { ReadableTime } from './ReadableTime.js';

export const PopupFooter: VFC<PopupData> = (props) => {
  const handleOptionsClick: JSX.MouseEventHandler<EventTarget> = (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  };
  const handleUpdateClick: JSX.MouseEventHandler<EventTarget> = (e) => {
    e.preventDefault();
    void executeAction(ExtensionAction.INSTANT_UPDATE);
  };
  const handleUnreadResetClick: JSX.MouseEventHandler<EventTarget> = (e) => {
    e.preventDefault();
    void executeAction(ExtensionAction.CLEAR_MARK_READ);
  };
  return (
    <Fragment>
      Last updated: {props.lastCheck ? <ReadableTime date={props.lastCheck} /> : 'Unknown'}
      {props.updating && <LoadingIndicator />}
      <br />
      <a href="#options" onClick={handleOptionsClick}>Options</a>
      {' • '}
      <a href="#update" className={props.updating ? 'disabled' : undefined} onClick={handleUpdateClick}>Update now</a>
      {' • '}
      <a href="#reset-unreads" className={props.updating ? 'disabled' : undefined} onClick={handleUnreadResetClick}>
        Reset unreads
      </a>
    </Fragment>
  );
};
