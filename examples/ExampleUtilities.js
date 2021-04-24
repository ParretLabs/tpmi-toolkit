let ExampleUtilities = {};

ExampleUtilities.Timer = class Timer {
	constructor() {
		this.time = 0;
	}

	start() {
		this.time = Date.now();
	}

	stop() {
		const time = this.time;
		this.time = 0;
		return Date.now() - time;
	}
}

module.exports = ExampleUtilities;