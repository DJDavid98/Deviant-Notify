import { Options } from './options.class.js';
import { Extension } from './extension.class.js';
import { RequestUtils } from './request-utils.js';

/**
 * @type {{
 *   options: Options,
 *   extension: Extension,
 *   reqUtils: RequestUtils,
 * }}
 */
export const singleton = {};

singleton.options = new Options(singleton);
singleton.extension = new Extension(singleton);
singleton.reqUtils = new RequestUtils(singleton);
