import { ReadStateManager } from './classes/read-state-manager.js';
import { ExtensionScope } from './common-types.js';
import { ExtensionManager } from './classes/extension-manager.js';
import { NotificationManager } from './classes/notification-manager.js';
import { OptionsManager } from './classes/options-manager.js';
import { RequestUtils } from './request-utils.js';

export const singleton: ExtensionScope = {} as unknown as ExtensionScope;

singleton.options = new OptionsManager(singleton);
singleton.notifier = new NotificationManager(singleton);
singleton.extension = new ExtensionManager(singleton);
singleton.reqUtils = new RequestUtils();
singleton.read = new ReadStateManager(singleton);
