import { PopupData, VFC } from '../../common-types.js';
import { h, Fragment } from '../../vendor/preact.js';
import { AllCountsDisplay } from './AllCountsDisplay.js';
import { SignInStatus } from './SignInStatus.js';

export const PopupContent: VFC<PopupData> = (props) => (
  <Fragment>
    <p><SignInStatus {...props} /></p>
    {props.signedIn ? <AllCountsDisplay {...props} /> : null}
  </Fragment>
);
