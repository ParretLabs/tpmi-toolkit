const { Point, Segment, Vector } = require('@flatten-js/core');

const Utilities = require('./utils/Utilities');
const GeometryUtilities = require('./utils/GeometryUtilities');

class Randomizer {
	constructor(seed) {
		this.random = Utilities.seed(seed || Date.now());
		this.randomInt = (min, max) => Utilities.getSeededRandomInt(this.random, min, max);
	}

	additiveRandomizeWalls(inputWallSegments, minVector, maxVector) {
		// Clone the wall segments
		let wallSegments = inputWallSegments.map(s => s.clone());

		let affectedWallSegments = {};

		for (let i = wallSegments.length - 1; i >= 0; i--) {
			const segmentHash = GeometryUtilities.hashSegment(wallSegments[i]);

			// console.log("segment", segmentHash);

			if(affectedWallSegments[segmentHash]) continue;

			// const startPoint = wallSegments[i].start;
			const endPoint = wallSegments[i].end;

			// const newStartPoint = this.additiveRandomizePoint(startPoint, minVector, maxVector);
			const newEndPoint = this.additiveRandomizePoint(endPoint, minVector, maxVector);

			for (let j = wallSegments.length - 1; j >= 0; j--) {
				const segmentHash = GeometryUtilities.hashSegment(wallSegments[j]);
				// if(affectedWallSegments[segmentHash]) continue;

				// if(wallSegments[j].start.equalTo(startPoint)) {
				// 	wallSegments[j] = new Segment(newStartPoint, wallSegments[j].end);
				// 	affectedWallSegments[segmentHash] = true;
				// }
				// if(wallSegments[j].end.equalTo(startPoint)) {
				// 	wallSegments[j] = new Segment(wallSegments[j].start, startPoint);
				// 	affectedWallSegments[segmentHash] = true;
				// }

				if(wallSegments[j].start.equalTo(endPoint)) {
					wallSegments[j] = new Segment(newEndPoint, wallSegments[j].end);
					affectedWallSegments[segmentHash] = true;
				}
				if(wallSegments[j].end.equalTo(endPoint)) {
					wallSegments[j] = new Segment(wallSegments[j].start, newEndPoint);
					affectedWallSegments[segmentHash] = true;
				}
			}
		}

		return wallSegments;
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