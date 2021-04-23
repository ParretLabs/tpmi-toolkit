const { Point, Segment, Vector, Box } = require('@flatten-js/core');

const Utilities = require('./Utilities');
const GeometryUtilities = require('./GeometryUtilities');

let VectorUtilities = {};

// Flexible custom tilemap generator. 
VectorUtilities.tileMapGenerator = (inputSettings={}) => {
	const settings = {
		detectorSize: 1,
		mapWidth: 1,
		mapHeight: 1,
		callback: () => {},
		...inputSettings
	};

	let tileMap = Utilities.createEmpty2dArray(settings.mapWidth, settings.mapHeight);
	let detectors = [];

	for (let y = 0; y < settings.mapHeight; y++) {
		for (let x = 0; x < settings.mapWidth; x++) {
			const detectorPos = new Point(x - (settings.detectorSize / 2), y - (settings.detectorSize / 2));
			const tileBoxDetector = new Box(
				detectorPos.x,
				detectorPos.y,
				detectorPos.x + settings.detectorSize,
				detectorPos.y + settings.detectorSize
			);

			detectors.push(tileBoxDetector);

			settings.callback(tileMap, new Point(x, y), tileBoxDetector);
		}
	}

	return {
		tileMap,
		detectors,
	};
};

// Moves all wall segments at a point to another point.
VectorUtilities.translateWallsAtPoint = (wallSegments, oldPoint, newPoint) => {
	let affectedWallSegments = {};

	for (let i = wallSegments.length - 1; i >= 0; i--) {
		const segmentHash = GeometryUtilities.hashSegment(wallSegments[i]);

		if(wallSegments[i].start.equalTo(oldPoint) && !newPoint.equalTo(wallSegments[i].start)) {
			wallSegments[i] = new Segment(newPoint, wallSegments[i].end);
			const newSegmentHash = GeometryUtilities.hashSegment(wallSegments[i]);

			affectedWallSegments[segmentHash] = true;
			affectedWallSegments[newSegmentHash] = true;
		}
		if(wallSegments[i].end.equalTo(oldPoint) && !newPoint.equalTo(wallSegments[i].end)) {
			wallSegments[i] = new Segment(wallSegments[i].start, newPoint);
			const newSegmentHash = GeometryUtilities.hashSegment(wallSegments[i]);
			
			affectedWallSegments[segmentHash] = true;
			affectedWallSegments[newSegmentHash] = true;
		}
	}

	return affectedWallSegments;
};

VectorUtilities.roundMapPositions = vectorMap => {
	for (let i = vectorMap.walls.length - 1; i >= 0; i--) {
		vectorMap.walls[i].start = GeometryUtilities.roundPoint(vectorMap.walls[i].start);
		vectorMap.walls[i].end = GeometryUtilities.roundPoint(vectorMap.walls[i].end);
	}

	return vectorMap.walls;
};

VectorUtilities.calculateMapSize = vectorMap => {
	let maxVector = new Vector(0, 0);

	for (let i = vectorMap.walls.length - 1; i >= 0; i--) maxVector = GeometryUtilities.maxVector(
		vectorMap.walls[i].start, 
		vectorMap.walls[i].end,
		maxVector
	);

	return GeometryUtilities.roundPoint(maxVector);
};

module.exports = VectorUtilities;