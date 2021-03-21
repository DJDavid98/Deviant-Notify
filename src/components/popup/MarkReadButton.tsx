import { ReadStateUpdater, VFC } from '../../common-types.js';
import { ExtensionAction } from '../../extension-action.js';
import { executeAction } from '../../utils.js';
import { h, useCallback } from '../../vendor/preact.js';

export interface MarkReadButtonProps {
  readStateUpdater: ReadStateUpdater;
  disabled?: boolean;
}

export const MarkReadButton: VFC<MarkReadButtonProps> = ({ readStateUpdater, disabled }) => {
  const handleClick = useCallback(() => {
    void executeAction(ExtensionAction.SET_MARK_READ, readStateUpdater(new Date()));
  }, [readStateUpdater]);
  return <button className="button button-link button-mark-read" onClick={handleClick} disabled={disabled}>
    Read
  </button>;
};
