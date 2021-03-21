import { VFC } from '../../common-types.js';
import { capNumberWithPlus } from '../../utils.js';
import { Fragment, h } from '../../vendor/preact.js';

export const NewItemCount: VFC<{ newCount: number; maxNewCount: number }> = ({ newCount, maxNewCount }) => (
  newCount > 0
    ? <span className="new-count">
      ({`${capNumberWithPlus(newCount, maxNewCount)} new`})
    </span>
    : <Fragment />
);
