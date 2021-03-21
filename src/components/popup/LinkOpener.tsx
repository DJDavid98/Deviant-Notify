import type { JSX } from 'preact';
import { FC } from '../../common-types.js';
import { makeURLFromPath } from '../../request-utils.js';
import { singleton } from '../../singleton.js';
import { createTab } from '../../utils.js';
import { h, useCallback, useMemo } from '../../vendor/preact.js';

export const LinkOpener: FC<{ path: string; className: string }> = ({ path, className, children }) => {
  const href = useMemo(() => makeURLFromPath(path, singleton.options), [path]);
  const dudLink = href === '';
  const handleClick: JSX.MouseEventHandler<HTMLAnchorElement> = useCallback((e) => {
    e.preventDefault();
    createTab(href);
  }, [href]);

  if (dudLink) return <span className={className}>{children}</span>;

  return <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={className}
    onClick={handleClick}
  >{children}</a>;
};
