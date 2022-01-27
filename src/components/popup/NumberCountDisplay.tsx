import { FC, LinkCreator, ReadStateUpdater } from '../../common-types.js';
import { plural } from '../../utils.js';
import { h, useMemo } from '../../vendor/preact.js';
import { LinkOpener } from './LinkOpener.js';
import { MarkReadButton } from './MarkReadButton.js';
import { NewItemCount } from './NewItemCount.js';
import { PopupIcon, PopupIconName } from './PopupIcon.js';
import { NotificationsBeta } from '../NotificationsBeta.js';

export interface NumberCountDisplayProps {
  count: number;
  maxCount?: number;
  newCount: number;
  maxNewCount: number;
  mainLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkCreator: LinkCreator<any>;
  icon?: PopupIconName;
  updating: boolean;
  readStateUpdater?: ReadStateUpdater;
  displayMarkRead?: boolean;
}

export const NumberCountDisplay: FC<NumberCountDisplayProps> = ({
  count: totalCount,
  maxCount,
  newCount,
  maxNewCount,
  icon,
  mainLabel,
  linkCreator,
  children,
  readStateUpdater,
  updating,
  displayMarkRead = true,
}) => {
  const displayedTotalCountLabel = useMemo(() => {
    if (totalCount === 0) return '';

    const pluralizedPrependedLabel = plural(totalCount, mainLabel);
    if (typeof maxCount === 'number' && totalCount > maxCount) {
      return pluralizedPrependedLabel.replace(/^\d+/, `${maxCount}+`);
    }
    return pluralizedPrependedLabel;
  }, [mainLabel, maxCount, totalCount]);

  if (totalCount === 0) return null;

  return (
    <div className="main-counter">
      <div className={`main-counter-item${newCount > 0 ? ' new-items' : ''}`}>
        {icon && <PopupIcon name={icon} className="notification-type-icon" />}
        <LinkOpener className="main-counter-link" path={linkCreator()}>
          {displayedTotalCountLabel}
          <NewItemCount newCount={newCount} maxNewCount={maxNewCount} />
        </LinkOpener>
        {displayMarkRead && newCount > 0 && readStateUpdater && (
          <MarkReadButton readStateUpdater={readStateUpdater} disabled={updating} />
        )}
      </div>
      {!displayMarkRead
        && <p className="heads-up"><strong>Note:</strong> Read state for this category is now managed in the new
          {' '}<NotificationsBeta />. You can mark individual items as read using the{' '}
          <PopupIcon name="checkmark" className="mark-read-tick" /> icon that appears when hovering an item with an
          unread item count.</p>}
      {children}
    </div>
  );
};
