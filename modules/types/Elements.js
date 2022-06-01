const { Point, Segment, Vector, Box, Polygon } = require('@flatten-js/core');
const { TEAMS } = require('../CONSTANTS');

let Elements = {};

Elements.BaseElement = class BaseElement {
	constructor(data) {
		if(!data){
			throw new Error("No shape data passed");
		} else if(typeof data.x === "number" && typeof data.y === "number") {
			this.shape = new Point(data.x, data.y);
		} else if(data.ps && data.pe) {
			this.shape = new Segment(data.ps, data.pe);
		} else if(Array.isArray(data)) {
			this.shape = new Polygon(data);
		} else {
			throw new Error("Invalid Element Shape: " + JSON.stringify(data));
		}
	}

	get x() {return this.shape.x}
	get y() {return this.shape.y}
	get shapeType() {return this.shape.constructor.name}

	visualize() {
		return this.shape.svg();
	}

	translate(vector) {
		this.shape = this.shape.translate(vector);
		return this;
	}

	round() {
		if(this.shapeType === "Point") {
			roundPoint(this.shape);
		} else if(this.shapeType === "Segment") {
			roundPoint(this.shape.start);
			roundPoint(this.shape.end);
		} else if(this.shapeType === "Polygon") {
			this.shape = new Polygon(this.shape.vertices.map(p => roundPoint(p)));
		}

		return this;
	}

	toPoints() {
		if(this.shapeType === "Point") {
			return [this.shape];
		} else if(this.shapeType === "Segment") {
			return [this.shape.start, this.shape.end];
		} else if(this.shapeType === "Polygon") {
			return this.shape.vertices;
		}
	}

	update(settings) {
		return Object.assign(this, settings);
	}

	clone() {
		return new Elements[this.constructor.name](this.shape);
	}
};

Elements.Wall = class Wall extends Elements.BaseElement {
	constructor({ps, pe}){
		super({ps, pe});
	}
}

Elements.OuterWall = class OuterWall extends Elements.BaseElement {
	constructor(vertices){
		super(vertices);
	}

	clone() {
		return new Elements[this.constructor.name](this.shape.vertices);
	}
}

Elements.Island = class Island extends Elements.BaseElement {
	constructor(vertices){
		super(vertices);
	}

	clone() {
		return new Elements[this.constructor.name](this.shape.vertices);
	}
}

Elements.Gate = class Gate extends Elements.BaseElement {
	constructor(vertices){
		super(vertices);
	}

	clone() {
		return new Elements[this.constructor.name](this.shape.vertices);
	}
}

Elements.Flag = class Flag extends Elements.BaseElement {
	constructor({x, y}, team){
		super({x, y});

		this.team = team;
	}

	visualize() {
		return this.shape.svg({
			r: 0.4,
			strokeWidth: 0.1,
			fill: this.team === TEAMS.RED ? "red" : "blue"
		});
	}

	clone() {
		return new Elements[this.constructor.name](this.shape, this.team);
	}
}

Elements.Spike = class Spike extends Elements.BaseElement {
	constructor({x, y}){
		super({x, y});
	}

	visualize() {
		return this.shape.svg({
			r: 0.4,
			strokeWidth: 0.1,
			fill: "gray"
		});
	}
}

Elements.Bomb = class Bomb extends Elements.BaseElement {
	constructor({x, y}){
		super({x, y});
	}

	visualize() {
		return this.shape.svg({
			r: 0.4,
			strokeWidth: 0.1,
			fill: "#222"
		});
	}
}

Elements.Boost = class Boost extends Elements.BaseElement {
	constructor({x, y}, team){
		super({x, y});

		this.team = team;
	}

	visualize() {
		return `<rect
			x="${this.shape.x - 0.25}"
			y="${this.shape.y - 0.25}"
			width="0.5" height="0.5"
			class="center"
			style="fill:${this.team === TEAMS.NONE ? "yellow" : (this.team === TEAMS.RED ? "red" : "blue")};stroke:black;stroke-width: 0.1;"
			transform="rotate(45)"
		></rect>`;
	}

	clone() {
		return new Elements[this.constructor.name](this.shape, this.team);
	}
}

Elements.Powerup = class Powerup extends Elements.BaseElement {
	constructor({x, y}){
		super({x, y});
	}

	visualize() {
		return this.shape.svg({
			r: 0.4,
			strokeWidth: 0.1,
			fill: "green"
		});
	}
}

Elements.Button = class Button extends Elements.BaseElement {
	constructor({x, y}){
		super({x, y});
	}

	visualize() {
		return this.shape.svg({
			r: 0.25,
			strokeWidth: 0.1,
			fill: "chocolate"
		});
	}
}

Elements.Portal = class Portal extends Elements.BaseElement {
	constructor({x, y}){
		super({x, y});
	}

	visualize() {
		return this.shape.svg({
			r: 0.4,
			strokeWidth: 0.1,
			fill: "mediumpurple"
		});
	}
}

function roundPoint(point) {
	point.x = Math.round(point.x);
	point.y = Math.round(point.y);
	return point;
}

module.exports = Elements;