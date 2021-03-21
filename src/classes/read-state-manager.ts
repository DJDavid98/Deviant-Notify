import type { DeepPartial } from 'tsdef';
import { ExtensionReadStates, ExtensionScope } from '../common-types.js';
import { DEFAULT_READ_STATE } from '../common.js';
import { isValidDate } from '../utils.js';

export class ReadStateManager {
  private readonly LOCAL_STORAGE_KEY = 'readState';

  private values: ExtensionReadStates;

  constructor(
    private scope: ExtensionScope,
  ) {
    this.values = JSON.parse(JSON.stringify(DEFAULT_READ_STATE));
  }

  load(): void {
    let parsed;
    try {
      const item = localStorage.getItem(this.LOCAL_STORAGE_KEY);
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

  update(setThese: DeepPartial<ExtensionReadStates>): void {
    this.processValues(setThese);
    this.save();
  }

  save(): void {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.values));
    this.scope.extension.restartUpdateInterval(true);
  }

  clear(): void {
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
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
}
