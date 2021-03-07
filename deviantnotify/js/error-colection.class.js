export class ErrorCollection {
	constructor() {
		this._collection = {};
		this.count = 0;
	}

	add(key, message) {
		if (typeof this._collection[key] === 'undefined')
			this._collection[key] = [];
		if ($.isArray(message)){
			this._collection[key] = this._collection[key].concat(message);
			this.count += message.length;
		}
		else {
			this._collection[key].push(message);
			this.count++;
		}
	}

	getAll() {
		return this._collection;
	}
}
