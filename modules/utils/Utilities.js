// First-Level Utility (Should never require any other utilities)
// General Utilities
const { Point, point } = require('@flatten-js/core');
const {TILE_COLORS, TILE_IDS} = require('../CONSTANTS');

let Utilities = {};

Utilities.createEmpty2dArray = (w, h) => Array(h).fill(0).map(a => Array(w).fill(0));

Utilities.seed = function(s) {
	let mask = 0xffffffff;
	let m_w  = (123456789 + s) & mask;
	let m_z  = (987654321 - s) & mask;

	return function() {
		m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
		m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;

		let result = ((m_z << 16) + (m_w & 65535)) >>> 0;
		result /= 4294967296;
		return result;
	}
}

Utilities.random = Utilities.seed(Date.now());

Utilities.getRandomInt = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

Utilities.getSeededRandomInt = (randomFunc, min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(randomFunc() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

Utilities.isSafeArrayLength = num => (
	typeof num === "number" &&
	Number.isSafeInteger(num) &&
	num > 0
);

Utilities.clamp = (num, min, max) => Math.max(Math.min(num, max), min);

Utilities.incrementTracker = tracker => tracker.slice(0, tracker.indexOf("-") + 1) + (Number(tracker.slice(tracker.indexOf("-") + 1)) + 1);

Utilities.hashNumberArray = (numbers, maxBytes=8) => {
	return parseInt(numbers.reduce((acc, val) => acc + val.toString(2).padStart(maxBytes, "0"), ""), 2);
}

Utilities.angleBetween = (p1, p2) => {
	p1 = point(p1);
	p2 = point(p2);
	return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

Utilities.distanceBetween = (p1, p2) => {
	p1 = point(p1);
	p2 = point(p2);
	return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

// https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
Utilities.getLinePoints = (p0, p1) => {
	let points = [];
	let deltax = p1.x - p0.x;
	let deltay = p1.y - p0.y;
	let deltaerr = Math.abs(deltay / deltax);

	let error = 0;
	let y = p0.y;
	for (let x = p0.x; x < p1.x; x++) {
		points.push(Utilities.roundPoint(new Point(x, y)));

		error = error + deltaerr;
		if(error >= 0.5) {
			y = y + Math.sign(deltay);
			error = error - 1;
		}
	}

	return points;
}

Utilities.getLinePointsAlt = (p0, p1) => {
	let points = [];
	let N = Utilities.diagonalDistance(p0, p1);
	for (let step = 0; step <= N; step++) {
		let t = N === 0 ? 0 : step / N;
		points.push(Utilities.roundPoint(Utilities.lerpPoint(p0, p1, t)));
	}
	return points;
}

Utilities.lerpPoint = (p0, p1, t) => {
	return new Point(Utilities.lerp(p0.x, p1.x, t), Utilities.lerp(p0.y, p1.y, t));
}

Utilities.roundPoint = point => pointFloatRemove("round", point);
Utilities.floorPoint = point => pointFloatRemove("floor", point);
Utilities.ceilPoint = point => pointFloatRemove("ceil", point);

Utilities.lerp = (start, end, t) => {
	return start + t * (end-start);
}

Utilities.diagonalDistance = (p0, p1) => {
	let dx = p1.x - p0.x, dy = p1.y - p0.y;
	return Math.max(Math.abs(dx), Math.abs(dy));
}

Utilities.tileToHex = (tile)  => {
	return Utilities.rgbToHex(TILE_COLORS[tile].r, TILE_COLORS[tile].b, TILE_COLORS[tile].g);
}

Utilities.hexToRGB = hex => {
	let b = hex >> 16;
	let g = hex >> 8 & 0xFF;
	let r = hex & 0xFF;
	return [r,g,b];
}

Utilities.rgbToHex = (r, g, b) => {
	return "#" + Utilities.componentToHex(r) + Utilities.componentToHex(g) + Utilities.componentToHex(b);
}

Utilities.componentToHex = (c)  => {
	let hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function pointFloatRemove(type, point) {
	point.x = Math[type](point.x);
	point.y = Math[type](point.y);
	return point;
}

module.exports = Utilities;