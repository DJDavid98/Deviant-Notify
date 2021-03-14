export class ErrorCollection {
  private collection: Record<string, string[]> = {};

  private totalCount = 0;

  get count(): number {
    return this.totalCount;
  }

  add(key: string, message: string | string[]): void {
    if (typeof this.collection[key] === 'undefined') this.collection[key] = [];
    if (Array.isArray(message)) {
      this.collection[key] = [...this.collection[key], ...message];
      this.totalCount += message.length;
    } else {
      this.collection[key].push(message);
      this.totalCount++;
    }
  }

  getAll(): Record<string, string[]> {
    return this.collection;
  }
}
