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

	randomizeWalls(inputWallSegments, randomFunc) {
		// Clone the wall segments
		let wallSegments = inputWallSegments.map(s => s.clone());
		// Track the segments that have been moved
		let affectedWallSegments = {};

		for (let i = wallSegments.length - 1; i >= 0; i--) {
			const segmentHash = GeometryUtilities.hashSegment(wallSegments[i]);

			// console.log("segment", segmentHash);

			if(affectedWallSegments[segmentHash]) continue;

			const oldPoint = wallSegments[i].end;
			const newPoint = randomFunc(oldPoint);

			let newAffectedWallSegments = VectorUtilities.translateWallsAtPoint(wallSegments, oldPoint, newPoint);
			affectedWallSegments = {...affectedWallSegments, ...newAffectedWallSegments};
		}

		return wallSegments;
	}

	additiveRandomizeWalls(wallSegments, minVector, maxVector) {
		return this.randomizeWalls(wallSegments, p => this.additiveRandomizePoint(p, minVector, maxVector));
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