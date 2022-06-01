// Second-level Utility (Can only require first-level utilities)
// For utilities that interact with Flatten.js and other geometry related functions.

const { point, Point, Segment, Vector, PlanarSet, Polygon, Box, Ray } = require('@flatten-js/core');
const { TILE_IDS } = require('../CONSTANTS');
const Utilities = require('./Utilities');

let GeometryUtilities = {};

// An class that consists of multiple segments.
// Acts like a laser that is able to bounce off objects and change direction.
GeometryUtilities.Laser = class Laser {
	constructor(x, y, angle) {
		this.startPoint = new Point(x, y);
		this.segments = [];
		this.angle = 0;

		this.changeDirection(angle);
	}

	get head() { return this.segments[this.segments.length - 1] }
	set head(val) { this.segments[this.segments.length - 1] = val; }

	changeDirection(angle) {

		let startPoint = this.startPoint;
		if(this.segments.length > 0) {
			startPoint = this.head.end.clone();
		}

		this.angle = GeometryUtilities.normalizeAngle(angle);
		this.segments.push(
			new Segment(startPoint, startPoint.translate(new Vector(Math.cos(this.angle), Math.sin(this.angle))))
		);
	}

	step(amount=1) {
		this.head = new Segment(
			this.head.start,
			this.head.end.translate(new Vector(Math.cos(this.angle) * amount, Math.sin(this.angle) * amount))
		)
	}

	visualize() {
		return `<g>${this.segments.map(s => s.svg({strokeWidth: 0.2})).join("")}</g>`;
	}
}

GeometryUtilities.createDetector = (point, inputSettings={}) => {
	const settings = {
		size: 1,
		...inputSettings
	};
	const detectorPos = new Point(
		point.x - (settings.size / 2),
		point.y - (settings.size / 2)
	);

	return new Box(
		detectorPos.x,
		detectorPos.y,
		detectorPos.x + settings.size,
		detectorPos.y + settings.size
	);
};

// Creates polygon that matches the shape of the input tile. Centered at the origin.
GeometryUtilities.tileIDToPolygon = (tileID, {x, y}) => {
	const translate = points => new Polygon(points).translate(new Vector(x, y));

	if(tileID === TILE_IDS.TLWALL) return translate([point(0, 0), point(-0.5, -0.5), point(0.5, -0.5), point(0.5, -0.5)]);
	if(tileID === TILE_IDS.TRWALL) return translate([point(0, 0), point(0.5, -0.5), point(0.5, 0.5), point(-0.5, -0.5)]);
	if(tileID === TILE_IDS.BLWALL) return translate([point(0, 0), point(-0.5, 0.5), point(-0.5, -0.5), point(0.5, 0.5)]);
	if(tileID === TILE_IDS.BRWALL) return translate([point(0, 0), point(0.5, 0.5), point(-0.5, 0.5), point(0.5, -0.5)]);

	return translate(new Box(-0.5, -0.5, 0.5, 0.5));
};

GeometryUtilities.hashSegment = segment => {
	return Utilities.hashNumberArray([segment.start.x, segment.start.y, segment.end.x, segment.end.y]);
};

// There seems to be a bug in flatten.js that doesn't allow PlanarSet's to be created normally through:
// "new PlanarSet(shapes)". This function exists as a workaround.
GeometryUtilities.createPlanarSet = shapes => {
	let planarSet = new PlanarSet();
	shapes.forEach(shape => planarSet.add(shape));

	return planarSet;
};

// Checks for clear line of sight between to points. Uses a planar set as the obstructions.
GeometryUtilities.clearLineOfSight = (startPoint, endPoint, blockingPlanarSet) => {
	let detectors = Utilities.getLinePointsAlt(startPoint, endPoint).map(p => {
		return GeometryUtilities.createDetector(p, {size: 1})
	});

	for (let i = detectors.length - 1; i >= 0; i--) if(blockingPlanarSet.search(detectors[i])[0]) return false;

	return true;
};

GeometryUtilities.pointsEqualTo = (points, eqPoint, func="every") => points[func](p => eqPoint.equalTo(p));
GeometryUtilities.getClosestPoint = (points, anchor) => points.reduce((acc, p) => {
	const dist = p.distanceTo(anchor);
	return acc[1] > dist ? [p, dist] : acc;
}, [points[0] || null, points[0].distanceTo(anchor)])[0];

GeometryUtilities.maxVector = (...vectors) => vectorMinMax("max", vectors);
GeometryUtilities.minVector = (...vectors) => vectorMinMax("min", vectors);

GeometryUtilities.normalizeAngle = radians => radians - (Math.PI * 2) * Math.floor(radians / (Math.PI * 2));
GeometryUtilities.normalizeAngleNegative = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

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