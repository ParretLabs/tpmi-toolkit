const { Point, Segment, Vector } = require('@flatten-js/core');

const GeometryUtilities = require('../utils/GeometryUtilities');

module.exports = Vectorizer => {
	Vectorizer.fillWallHoles = (walls) => {
		let newMapWalls = [];
		const looseEnds = [];

		let maxVector = new Vector(0, 0);

		// Find the loose ends
		// Loose ends are found by looking for segments that don't have 2 segments on either side of itself.
		for (let i = walls.length - 1; i >= 0; i--) {
			let startSegmentClosed = false;
			let endSegmentClosed = false;

			if(walls[i].length === 0) continue; // skip 0-length walls

			for (let j = walls.length - 1; j >= 0; j--) {
				// Don't match segment against itself
				if(i === j) continue;
				if(walls[j].length === 0) continue; // skip 0-length walls

				if(walls[i].start.equalTo(walls[j].end)) startSegmentClosed = true;
				if(walls[i].start.equalTo(walls[j].start)) startSegmentClosed = true;

				if(walls[i].end.equalTo(walls[j].start)) endSegmentClosed = true;
				if(walls[i].end.equalTo(walls[j].end)) endSegmentClosed = true;

				if(startSegmentClosed && endSegmentClosed) break;
			}

			if(!startSegmentClosed || !endSegmentClosed) {
				// Skip floating segments
				// This function only tracks loose ends, not islands.
				if(!startSegmentClosed && !endSegmentClosed) continue;

				looseEnds.push({
					segment: walls[i],
					startIsLoose: !startSegmentClosed
				});
			}

			// Get size
			maxVector = GeometryUtilities.maxVector(walls[i].start, walls[i].end, maxVector);
		}

		// Iterate through the loose ends
		// Match each one against each other to find the closest ones.
		// Find the best possible pair, draw a segment to fill the hole,
		// then mark it as used.
		for (let i = looseEnds.length - 1; i >= 0; i--) {
			if(!looseEnds[i]) continue;

			const loosePoint = looseEnds[i].startIsLoose ? looseEnds[i].segment.start : looseEnds[i].segment.end;

			let closestLoose = {
				point: null,
				distance: Math.max(maxVector.x, maxVector.y) / 8,
				index: -1
			};

			for (let j = looseEnds.length - 1; j >= 0; j--) {
				// Don't match loose end against itself
				if(i === j) continue;
				if(!looseEnds[j]) continue;
				
				const loosePoint2 = looseEnds[j].startIsLoose ? looseEnds[j].segment.start : looseEnds[j].segment.end;

				const [dist, shortest_segment] = loosePoint.distanceTo(loosePoint2);
				if(dist < closestLoose.distance) closestLoose = {
					point: loosePoint2,
					distance: dist,
					index: j
				};
			}

			if(closestLoose.point) {
				newMapWalls.push(new Segment(
					loosePoint,
					closestLoose.point
				));

				looseEnds.splice(i, 1);
				looseEnds.splice(closestLoose.index, 1);
			}
		}

		newMapWalls = newMapWalls.concat(walls);

		return newMapWalls;
	};
};