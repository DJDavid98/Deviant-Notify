import { StorageLocation } from './common-types.js';
import { AsyncStorage } from './classes/async-storage.js';

export const AsyncSyncStorage = new AsyncStorage(StorageLocation.SYNC);
export const AsyncLocalStorage = new AsyncStorage(StorageLocation.LOCAL);
