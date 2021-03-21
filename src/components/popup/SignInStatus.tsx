import type { JSX } from 'preact';
import { PopupData, VFC } from '../../common-types.js';
import { ExtensionAction } from '../../extension-action.js';
import {
  executeAction,
  markAllNotifsRead,
  NumberObject,
  plural,
  recursiveSum,
} from '../../utils.js';
import { Fragment, h, useCallback, useMemo } from '../../vendor/preact.js';

export const SignInStatus: VFC<PopupData> = (props) => {
  const totalCount = useMemo(() => (
    props.signedIn
      ? recursiveSum({
        ...props.watch,
        ...props.feedback,
        messages: props.messages,
      })
      : 0
  ), [props.feedback, props.messages, props.signedIn, props.watch]);
  const newCount = useMemo(() => recursiveSum(props.newCounts as unknown as NumberObject), [props.newCounts]);
  const handleReadAll: JSX.MouseEventHandler<EventTarget> = useCallback((e) => {
    e.preventDefault();
    if (props.updating) return;
    markAllNotifsRead();
  }, [props.updating]);

  if (!props.signedIn) {
    return (
      <button className="button" onClick={() => executeAction(ExtensionAction.OPEN_SIGN_IN_PAGE)}>Sign in</button>
    );
  }

  return (
    <Fragment>
      <strong>{plural(totalCount, 'message')}</strong>
      {' for '}
      <strong>{props.username}</strong>
      {newCount > 0 && (
        <Fragment>
          <br />
          <strong className="new-items-color">{plural(newCount, 'new message')}</strong>
          {' • '}
          <a href="#mark-all-read" onClick={handleReadAll} className={props.updating ? 'disabled' : undefined}>
            <strong>Mark all as read</strong>
          </a>
        </Fragment>
      )}
    </Fragment>
  );
};
