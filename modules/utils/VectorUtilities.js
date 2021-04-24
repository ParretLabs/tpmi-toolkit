// VectorMap Utilities

const { Point, Segment, Vector, Box, PlanarSet } = require('@flatten-js/core');

const { TILE_IDS, TEAMS } = require('../SETTINGS');
const Elements = require('../types/Elements');
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

// Converts an array of element arrays into a singular planar set.
VectorUtilities.generatePlanarSetFromElementArrays = (...elementArrays) => {
	let shapes = [
		...[...elementArrays.map(a => a.map(e => e.point || e))]
	];

	return new PlanarSet(shapes);
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

VectorUtilities.getVectorElementsFromTileMap = tileMap => {
	let flags = [];
	let spikes = [];
	let bombs = [];

	for (let y = 0; y < tileMap.length; y++) {
		for (let x = 0; x < tileMap[0].length; x++) {
			const isTile = id => tileMap[y][x] === id;

			if(isTile(TILE_IDS.REDFLAG)) flags.push(new Elements.Flag(x, y, TEAMS.RED));
			else if(isTile(TILE_IDS.BLUEFLAG)) flags.push(new Elements.Flag(x, y, TEAMS.BLUE));
			else if(isTile(TILE_IDS.SPIKE)) spikes.push(new Elements.Spike(x, y));
			else if(isTile(TILE_IDS.BOMB)) bombs.push(new Elements.Bomb(x, y));
		}
	}

	return { flags, spikes, bombs };
};

VectorUtilities.sliceVectorElements = (elements, sliceLine) => {
	const newElements = [];

	const [lA, lB, lC] = sliceLine.standard;
	const isPointSafe = point => point.y < (lC - (lA * point.x)) / lB;

	for (let i = elements.length - 1; i >= 0; i--) {
		let intersection;

		// Detect if both ends of a segment are inside the safe-zone.
		if(elements[i].constructor.name === "Segment") {
			if(isPointSafe(elements[i].start) && isPointSafe(elements[i].end)) {
				newElements.push(elements[i]);
			} else if(intersection = elements[i].intersect(sliceLine)){
				// If the segment intersects with the safe-zone border, slice it inhalf.
				if(intersection.length === 0) continue;

				let slicedSegments = elements[i].split(intersection[0]);
				let safeSlice = slicedSegments.find(s => s && (isPointSafe(s.start) || isPointSafe(s.end)));

				if(safeSlice) newElements.push(safeSlice);
			}
		} else if(elements[i].point) {
			const elementPoint = elements[i].point;
			if(isPointSafe(elementPoint)) {
				newElements.push(elements[i]);
			}
		}
	}

	return newElements;
};

VectorUtilities.findSmallestElementVector = (wallSegments) => {
	let translationVector = new Vector(0, 0);

	for (let i = wallSegments.length - 1; i >= 0; i--) translationVector = GeometryUtilities.minVector(
		wallSegments[i].start, 
		wallSegments[i].end,
		translationVector
	);

	return translationVector;
};

VectorUtilities.mirrorVectorElements = (elements, mirrorFunc) => {
	const newElements = [];

	for (let i = elements.length - 1; i >= 0; i--) {
		const element1 = elements[i].clone();
		let element2 = elements[i].clone();

		if(elements[i].constructor.name === "Segment") {
			element2 = new Segment(mirrorFunc(element2.start), mirrorFunc(element2.end));

			newElements.push(element1);
			newElements.push(element2);
		} else if(elements[i].point) {
			element2.point = mirrorFunc(element2.point);

			if(element2.team) element2.team = element2.team === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;

			newElements.push(element1);
			newElements.push(element2);
		}
	}

	return newElements;
};

module.exports = VectorUtilities;