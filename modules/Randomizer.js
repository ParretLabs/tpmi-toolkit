const { Point, Segment, Vector } = require('@flatten-js/core');

const Utilities = require('./utils/Utilities');
const VectorUtilities = require('./utils/VectorUtilities');
const GeometryUtilities = require('./utils/GeometryUtilities');

class Randomizer {
	constructor(seed) {
		this.seed = seed || Date.now();
		this.random = Utilities.seed(this.seed);
		this.randomInt = (min, max) => Utilities.getSeededRandomInt(this.random, min, max);
	}

	randomizeWalls(inputWallElements, randomFunc) {
		// Clone the wall segments
		let wallElements = inputWallElements.map(s => s.clone());
		// Track the segments that have been moved
		let affectedWallElements = {};

		for (let i = wallElements.length - 1; i >= 0; i--) {
			const elementHash = GeometryUtilities.hashSegment(wallElements[i].shape);

			// console.log("segment", elementHash);

			if(affectedWallElements[elementHash]) continue;

			const oldPoint = wallElements[i].shape.end;
			const newPoint = randomFunc(oldPoint);

			let newAffectedWallSegments = VectorUtilities.translateWallsAtPoint(wallElements, oldPoint, newPoint);
			affectedWallElements = {...affectedWallElements, ...newAffectedWallSegments};
		}

		return wallElements;
	}

	additiveRandomizeWalls(wallElements, minVector, maxVector) {
		return this.randomizeWalls(wallElements, p => this.additiveRandomizePoint(p, minVector, maxVector));
	}

	additiveRandomizeSegment(segment, minVector, maxVector) {
		return new Segment(
			this.additiveRandomizePoint(segment.start, minVector, maxVector),
			this.additiveRandomizePoint(segment.end, minVector, maxVector)
		);
	}

	additiveRandomizePoint(point, minVector, maxVector) {
		return new Point(
			point.x + this.randomInt(minVector.x, maxVector.x),
			point.y + this.randomInt(minVector.y, maxVector.y)
		);
	}
}

module.exports = Randomizer;