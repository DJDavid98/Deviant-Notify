import type { DeepPartial } from 'tsdef';
import { ExtensionReadStates, ExtensionScope } from '../common-types.js';
import { DEFAULT_READ_STATE } from '../common.js';
import { isValidDate } from '../utils.js';
import { AsyncStorage } from './async-storage.js';

export class ReadStateManager {
  private readonly STORAGE_KEY = 'readState';

  private values: ExtensionReadStates;

  constructor(private scope: ExtensionScope) {
    this.values = JSON.parse(JSON.stringify(DEFAULT_READ_STATE));
  }

  protected async tryToMigrateOldLocalstorage(): Promise<void> {
    const dataToMigrate = localStorage.getItem(this.STORAGE_KEY);
    if (dataToMigrate === null) return;

    await this.storage.setItem(this.STORAGE_KEY, dataToMigrate);
  }

  async load(): Promise<void> {
    await this.tryToMigrateOldLocalstorage();

    let parsed;
    try {
      const item = await this.storage.getItem(this.STORAGE_KEY);
      if (item) {
        parsed = JSON.parse(item);
      }
    } catch (e) {
      console.error('Could not load read state, see error below');
      console.error(e);
    }

    let untrustedOptions = {};
    if (typeof parsed !== 'undefined' && parsed !== null) {
      untrustedOptions = { ...parsed };
    }

    this.processValues(untrustedOptions);
  }

  processValues(setThese: DeepPartial<ExtensionReadStates>): void {
    const validValue = (value: unknown) => typeof value === 'object' && (value === null || value instanceof Date);
    const coerceUntrustedValue = (value: unknown): Date | null | undefined => {
      if (typeof value === 'undefined') {
        return undefined;
      }

      if (typeof value === 'object' && value instanceof Date && isValidDate(value)) {
        return value;
      }

      // Attempt to parse stored Date string
      if (typeof value === 'string') {
        let tryDate: Date | undefined;
        try {
          tryDate = new Date(value);
        } catch (e) {
          console.error(`coerceUntrustedValue: cannot create date from ${value}`);
        }

        if (isValidDate(tryDate)) {
          return tryDate;
        }
      }

      // Assume stored value is nonsensical, reset it
      return null;
    };
    const recurse = (originalObject: Record<string, unknown>, untrustedObject: Record<string, unknown>) => {
      Object.keys(originalObject).forEach((key) => {
        if (!(key in untrustedObject)) return;

        const originalValue = originalObject[key];
        if (validValue(originalValue)) {
          const untrustedValue = coerceUntrustedValue(untrustedObject[key]);
          if (validValue(untrustedValue)) {
            // eslint-disable-next-line no-param-reassign
            originalObject[key] = untrustedValue;
          }
        } else if (key in untrustedObject) {
          // This is most likely a nested object
          recurse(originalObject[key] as Record<string, unknown>, untrustedObject[key] as Record<string, unknown>);
        }
      });
    };

    if (Object.keys(setThese).length > 0) {
      recurse(this.values as unknown as Record<string, unknown>, setThese);
    }
  }

  async update(setThese: DeepPartial<ExtensionReadStates>): Promise<void> {
    this.processValues(setThese);
    await this.save();
  }

  async save(): Promise<void> {
    await this.storage.setItem(this.STORAGE_KEY, JSON.stringify(this.values));
    this.scope.extension.restartUpdateInterval(true);
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(this.STORAGE_KEY);
    this.values = JSON.parse(JSON.stringify(DEFAULT_READ_STATE));
    this.scope.extension.restartUpdateInterval(true);
  }

  get<K extends keyof ExtensionReadStates>(name: K): ExtensionReadStates[K];

  get(name: string): unknown {
    return this.values[name as keyof ExtensionReadStates];
  }

  getAll(): ExtensionReadStates {
    return this.values;
  }

  protected get storage(): AsyncStorage {
    return this.scope.options.getReadStateStorage();
  }

  async migrateData(from: AsyncStorage, to: AsyncStorage): Promise<void> {
    const existingData = await from.getItem(this.STORAGE_KEY);
    if (existingData === null) return;

    await to.setItem(this.STORAGE_KEY, existingData);
    await from.removeItem(this.STORAGE_KEY);
  }
}
