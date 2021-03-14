import { VFC } from '../../common-types.js';
import { h } from '../../vendor/preact.js';
import { KeyboardModifierKey, MacKey, PcKey } from './KeyboardModifierKey.js';

export const CtrlKey: VFC = () => <KeyboardModifierKey mac={MacKey.COMMAND} pc={PcKey.CONTROL} />;
