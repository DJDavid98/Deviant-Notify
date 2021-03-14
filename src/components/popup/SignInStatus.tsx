import { VFC } from '../../common-types.js';
import { ExtensionAction } from '../../extension-action.js';
import { executeAction } from '../../utils.js';
import { Fragment, h } from '../../vendor/preact.js';

type PropTypes = { signedIn?: false } | {
  signedIn: true;
  username: string;
  domain: string;
};

export const SignInStatus: VFC<PropTypes> = (props) => {
  if (typeof props.signedIn === 'undefined') return <Fragment>Loading&hellip;</Fragment>;

  if (!props.signedIn) {
    return (
      <button className="button" onClick={() => executeAction(ExtensionAction.OPEN_SIGN_IN_PAGE)}>Sign in</button>
    );
  }

  return (
    <Fragment>
      {'For '}
      <strong>{props.username}</strong>
      {' from '}
      <strong>{props.domain}</strong>
    </Fragment>
  );
};
