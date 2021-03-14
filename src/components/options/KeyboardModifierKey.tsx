import { VFC } from '../../common-types.js';
import { isMac } from '../../common.js';
import { h } from '../../vendor/preact.js';

export enum MacKey {
  COMMAND = '\u2318',
  OPTION = '\u2325',
}

export enum PcKey {
  CONTROL = 'Ctrl',
  ALT = 'Alt',
}

interface PropTypes {
  pc: PcKey;
  mac: MacKey;
}

export const KeyboardModifierKey: VFC<PropTypes> = ({ mac, pc }) =>
  <kbd>{isMac ? mac : pc}</kbd>;
