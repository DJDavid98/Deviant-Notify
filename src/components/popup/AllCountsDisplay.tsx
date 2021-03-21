import {
  FeedbackMessageTypes,
  PopupData,
  ReadStateUpdater,
  TypedReadStateUpdater,
  VFC,
  WatchMessageTypes,
} from '../../common-types.js';
import {
  FEEDBACK_MESSAGE_TYPE_READABLE_NAMES,
  MAX_NEW_COUNTS,
  VALID_FEEDBACK_MESSAGE_TYPES,
  VALID_WATCH_MESSAGE_TYPES,
  WATCH_MESSAGE_TYPE_READABLE_NAMES,
} from '../../common.js';
import { getFeedbackNotifsPath, getNotesPath, getWatchNotifsPath } from '../../link-builders.js';
import { h, useCallback } from '../../vendor/preact.js';
import { NumberCountDisplay } from './NumberCountDisplay.js';
import { ObjectCountDisplay } from './ObjectCountDisplay.js';

export const AllCountsDisplay: VFC<PopupData> = ({
  watch,
  feedback,
  messages,
  newCounts,
  updating,
}) => {
  const handleFeedbackReadKeyStateUpdate: TypedReadStateUpdater<FeedbackMessageTypes> = useCallback((type) =>
    (date) => {
      if (!VALID_FEEDBACK_MESSAGE_TYPES.includes(type)) throw new Error(`Invalid feedback message type ${type}`);
      return { feedback: { [type]: date } };
    }, []);
  const handleFeedbackReadStateUpdate: ReadStateUpdater = useCallback((date) => ({
    feedback: VALID_FEEDBACK_MESSAGE_TYPES.reduce((a, c) => ({
      ...a,
      [c]: date,
    }), {}),
  }), []);
  const handleWatchReadKeyStateUpdate: TypedReadStateUpdater<WatchMessageTypes> = useCallback((type) =>
    (date) => {
      if (!VALID_WATCH_MESSAGE_TYPES.includes(type)) throw new Error(`Invalid watch message type ${type}`);
      return { watch: { [type]: date } };
    }, []);
  const handleWatchReadStateUpdate: ReadStateUpdater = useCallback((date) => ({
    watch: VALID_WATCH_MESSAGE_TYPES.reduce((a, c) => ({
      ...a,
      [c]: date,
    }), {}),
  }), []);
  return (
    <div id="count-display">
      <NumberCountDisplay
        count={messages}
        newCount={newCounts.messages}
        maxNewCount={MAX_NEW_COUNTS.notes}
        mainLabel="Note"
        icon="chat"
        linkCreator={getNotesPath}
        readStateUpdater={(date) => ({ messages: date })}
        updating={updating}
      />
      <ObjectCountDisplay
        counts={feedback}
        newCounts={newCounts.feedback}
        maxNewCount={MAX_NEW_COUNTS.notifications}
        mainLabel="Feedback Message"
        icon="bell"
        subLabels={FEEDBACK_MESSAGE_TYPE_READABLE_NAMES}
        linkCreator={getFeedbackNotifsPath}
        keysInOrder={VALID_FEEDBACK_MESSAGE_TYPES}
        readStateUpdater={handleFeedbackReadStateUpdate}
        updating={updating}
        keyReadStateUpdater={handleFeedbackReadKeyStateUpdate}
      />
      <ObjectCountDisplay
        counts={watch}
        newCounts={newCounts.watch}
        maxNewCount={MAX_NEW_COUNTS.notifications}
        mainLabel="Watch Message"
        icon="watch"
        subLabels={WATCH_MESSAGE_TYPE_READABLE_NAMES}
        linkCreator={getWatchNotifsPath}
        keysInOrder={VALID_WATCH_MESSAGE_TYPES}
        readStateUpdater={handleWatchReadStateUpdate}
        updating={updating}
        keyReadStateUpdater={handleWatchReadKeyStateUpdate}
      />
    </div>
  );
};
