import { VFC } from '../../common-types.js';
import { h, useMemo } from '../../vendor/preact.js';

export const ReadableTime: VFC<{ date: string }> = ({ date }) => {
  const dateObj = useMemo(() => new Date(date), [date]);
  return <time dateTime={date}>{dateObj.toLocaleTimeString()}</time>;
};
