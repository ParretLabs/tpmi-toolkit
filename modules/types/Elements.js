const { Point, Segment, Vector, Box } = require('@flatten-js/core');
const { TEAMS } = require('../SETTINGS');

let Elements = {};

Elements.BaseElement = class BaseElement {
	constructor(x, y) {
		this.point = new Point(x, y);
	}

	get x() {return this.point.x}
	get y() {return this.point.y}

	visualize() {
		return this.point.svg();
	}

	clone() {
		return new Elements[this.constructor.name](this.x, this.y);
	}
};

Elements.Flag = class Flag extends Elements.BaseElement {
	constructor(x, y, team){
		super(x, y);

		this.team = team;
	}

	visualize() {
		return this.point.svg({
			r: 0.5,
			strokeWidth: 0.1,
			fill: this.team === TEAMS.RED ? "red" : "blue"
		});
	}

	clone() {
		return new Elements[this.constructor.name](this.x, this.y, this.team);
	}
}

Elements.Spike = class Spike extends Elements.BaseElement {
	constructor(x, y){
		super(x, y);
	}

	visualize() {
		return this.point.svg({
			r: 0.5,
			strokeWidth: 0.1,
			fill: "gray"
		});
	}
}

Elements.Bomb = class Bomb extends Elements.BaseElement {
	constructor(x, y){
		super(x, y);
	}

	visualize() {
		return this.point.svg({
			r: 0.5,
			strokeWidth: 0.1,
			fill: "black"
		});
	}
}

module.exports = Elements;