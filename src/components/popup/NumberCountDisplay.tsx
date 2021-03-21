import { FC, LinkCreator, ReadStateUpdater } from '../../common-types.js';
import { plural } from '../../utils.js';
import { h } from '../../vendor/preact.js';
import { LinkOpener } from './LinkOpener.js';
import { MarkReadButton } from './MarkReadButton.js';
import { NewItemCount } from './NewItemCount.js';
import { PopupIcon, PopupIconName } from './PopupIcon.js';

export interface NumberCountDisplayProps {
  count: number;
  newCount: number;
  maxNewCount: number;
  mainLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkCreator: LinkCreator<any>;
  icon?: PopupIconName;
  updating: boolean;
  readStateUpdater?: ReadStateUpdater;
}

export const NumberCountDisplay: FC<NumberCountDisplayProps> = ({
  count: totalCount,
  newCount,
  maxNewCount,
  icon,
  mainLabel,
  linkCreator,
  children,
  readStateUpdater,
  updating,
}) => {
  if (totalCount === 0) return null;

  return (
    <div className="main-counter">
      <div className={`main-counter-item${newCount > 0 ? ' new-items' : ''}`}>
        {icon && <PopupIcon name={icon} className="notification-type-icon" />}
        <LinkOpener className="main-counter-link" path={linkCreator()}>
          {plural(totalCount, mainLabel)}
          <NewItemCount newCount={newCount} maxNewCount={maxNewCount} />
        </LinkOpener>
        {newCount > 0 && readStateUpdater && (
          <MarkReadButton readStateUpdater={readStateUpdater} disabled={updating} />
        )}
      </div>
      {children}
    </div>
  );
};
