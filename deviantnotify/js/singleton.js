import { Options } from './options.class.js';
import { Extension } from './extension.class.js';
import { RequestUtils } from './request-utils.js';
import { Notifier } from './notifier.class.js';

/**
 * @typedef ExtensionScope
 * @property {Options} options
 * @property {Extension} extension
 * @property {RequestUtils} reqUtils
 * @property {Notifier} notifier
 */

/**
 * @type {ExtensionScope}
 */
export const singleton = {};

singleton.options = new Options(singleton);
singleton.notifier = new Notifier(singleton);
singleton.extension = new Extension(singleton);
singleton.reqUtils = new RequestUtils(singleton);
