const { Point, Vector } = require('@flatten-js/core');
const Utilities = require('./Utilities');

let GeometryUtilities = {};

GeometryUtilities.hashSegment = segment => {
	return Utilities.hashNumberArray([segment.start.x, segment.start.y, segment.end.x, segment.end.y]);
};

GeometryUtilities.getLinePointsAlt = (p0, p1) => {
	let points = [];
	let N = GeometryUtilities.diagonalDistance(p0, p1);
	for (let step = 0; step <= N; step++) {
		let t = N === 0 ? 0 : step / N;
		points.push(GeometryUtilities.roundPoint(GeometryUtilities.lerpPoint(p0, p1, t)));
	}
	return points;
}

// https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
GeometryUtilities.getLinePoints = (p0, p1) => {
	let points = [];
	let deltax = p1.x - p0.x;
	let deltay = p1.y - p0.y;
	let deltaerr = Math.abs(deltay / deltax);

	let error = 0;
	let y = p0.y;
	for (let x = p0.x; x < p1.x; x++) {
		points.push(GeometryUtilities.roundPoint(new Point(x, y)));

		error = error + deltaerr;
		if(error >= 0.5) {
			y = y + Math.sign(deltay);
			error = error - 1;
		}
	}

	return points;
}

GeometryUtilities.diagonalDistance = (p0, p1) => {
	let dx = p1.x - p0.x, dy = p1.y - p0.y;
	return Math.max(Math.abs(dx), Math.abs(dy));
}

GeometryUtilities.lerpPoint = (p0, p1, t) => {
	return new Point(GeometryUtilities.lerp(p0.x, p1.x, t), GeometryUtilities.lerp(p0.y, p1.y, t));
}

GeometryUtilities.roundPoint = point => pointFloatRemove("round", point);
GeometryUtilities.floorPoint = point => pointFloatRemove("floor", point);
GeometryUtilities.ceilPoint = point => pointFloatRemove("ceil", point);

GeometryUtilities.lerp = (start, end, t) => {
	return start + t * (end-start);
}

GeometryUtilities.maxVector = (...vectors) => vectorMinMax("max", vectors);
GeometryUtilities.minVector = (...vectors) => vectorMinMax("min", vectors);

function vectorMinMax(type, vectors) {
	let minMaxVector = vectors[0].clone();
	for (let i = vectors.length - 1; i >= 0; i--) {
		minMaxVector.x = Math[type](
			vectors[i].x,
			minMaxVector.x
		);

		minMaxVector.y = Math[type](
			vectors[i].y,
			minMaxVector.y
		);
	}

	return minMaxVector;
}

function pointFloatRemove(type, point) {
	point.x = Math[type](point.x);
	point.y = Math[type](point.y);
	return point;
}

module.exports = GeometryUtilities;