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
		return new Elements.BaseElement(this.x, this.y);
	}
};

Elements.Flag = class FlagElement extends Elements.BaseElement {
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
		return new Elements.Flag(this.x, this.y, this.team);
	}
}

module.exports = Elements;