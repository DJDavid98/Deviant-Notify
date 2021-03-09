export class ErrorCollection {
  constructor() {
    /**
     * @type {Record<string, string[]>}
     * @private
     */
    this.collection = {};
    /**
     * @type {number}
     * @private
     */
    this.totalCount = 0;
  }

  get count() {
    return this.totalCount;
  }

  /**
   * @param {string} key
   * @param {string|string[]} message
   */
  add(key, message) {
    if (typeof this.collection[key] === 'undefined') this.collection[key] = [];
    if (Array.isArray(message)) {
      this.collection[key] = [...this.collection[key], ...message];
      this.totalCount += message.length;
    } else {
      this.collection[key].push(message);
      this.totalCount++;
    }
  }

  /**
   * @return {Record<string, string[]>}
   */
  getAll() {
    return this.collection;
  }
}
