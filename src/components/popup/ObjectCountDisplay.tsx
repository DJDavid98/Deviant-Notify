import type { DeepPartial } from 'tsdef';
import { ExtensionReadStates, VFC } from '../../common-types.js';
import { plural, recursiveSum } from '../../utils.js';
import { Fragment, h } from '../../vendor/preact.js';
import { LinkOpener } from './LinkOpener.js';
import { MarkReadButton } from './MarkReadButton.js';
import { NewItemCount } from './NewItemCount.js';
import { NumberCountDisplay, NumberCountDisplayProps } from './NumberCountDisplay.js';

type CountDisplayComponentProps = Omit<NumberCountDisplayProps, 'count' | 'newCount'>;

interface PropTypes extends CountDisplayComponentProps {
  counts: Record<string, number>;
  newCounts: Record<string, number>;
  subLabels: Record<string, string>;
  keysInOrder?: string[] | readonly string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyReadStateUpdater?: (key: any) => (date: Date) => DeepPartial<ExtensionReadStates>
}

export const ObjectCountDisplay: VFC<PropTypes> = ({
  counts,
  newCounts,
  subLabels,
  keysInOrder,
  keyReadStateUpdater,
  ...numberCountProps
}) => {
  const totalCount = recursiveSum(counts);

  if (totalCount === 0) return null;

  const newCount = recursiveSum(newCounts);

  return (
    <NumberCountDisplay
      count={totalCount}
      newCount={newCount}
      {...numberCountProps}
    >
      <ul>
        {(keysInOrder || Object.keys(counts)).map((key) => (
          counts[key] > 0
            ? <li className={`sub-counter-item${newCounts[key] > 0 ? ' new-items' : ''}`} key={key}>
              <LinkOpener
                className="sub-counter-link"
                path={numberCountProps.linkCreator(key)}
              >
                {plural(counts[key], subLabels[key] || key)}
                <NewItemCount newCount={newCounts[key]} maxNewCount={numberCountProps.maxNewCount} />
              </LinkOpener>
              {newCounts[key] > 0 && keyReadStateUpdater && (
                <MarkReadButton readStateUpdater={keyReadStateUpdater(key)} disabled={numberCountProps.updating} />
              )}
            </li>
            : <Fragment key={key} />
        ))}
      </ul>
    </NumberCountDisplay>
  );
};
