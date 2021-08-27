import { StorageLocation } from '../common-types.js';
import { getItemsFromBrowserStorage, removeItemFromBrowserStorage, setItemInBrowserStorage } from '../utils.js';

export class AsyncStorage {
  constructor(protected storageKey: StorageLocation) {
  }

  async getItem(key: string): Promise<string | null> {
    const items = await getItemsFromBrowserStorage(this.storageKey, key);

    if (key in items) {
      const value = items[key];
      if (typeof value === 'string') {
        return value;
      }
    }

    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await setItemInBrowserStorage(this.storageKey, key, value);
  }

  async removeItem(key: string): Promise<void> {
    await removeItemFromBrowserStorage(this.storageKey, key);
  }
}
