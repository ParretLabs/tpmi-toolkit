// Third-Level Utility (Can access Second-level utilities)
// For working with VectorMaps

const { Point, Segment, Vector, Box, Line } = require('@flatten-js/core');

const { TILE_IDS, TEAMS, SYMMETRY, SYMMETRY_FUNCTIONS } = require('../CONSTANTS');
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
			const tileBoxDetector = GeometryUtilities.createDetector(new Point(x, y), {
				size: settings.detectorSize
			});

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
	].flat();
	
	return GeometryUtilities.createPlanarSet(shapes);
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

VectorUtilities.getFlagPair = flags => [
	flags.find(a => a.team === TEAMS.RED) || null,
	flags.find(a => a.team === TEAMS.BLUE) || null
];

VectorUtilities.elementsToPoints = elements => elements.reduce((acc, elem) => {
	if(elem.point) acc.push(elem.point);
	else if(elem.start && elem.end) return acc.concat([elem.start, elem.end]);
	else if(elem.x && elem.y) acc.push(elem);

	return acc;
}, []);

VectorUtilities.roundMapPositions = vectorMap => {
	for (let i = vectorMap.walls.length - 1; i >= 0; i--) {
		vectorMap.walls[i].start = GeometryUtilities.roundPoint(vectorMap.walls[i].start);
		vectorMap.walls[i].end = GeometryUtilities.roundPoint(vectorMap.walls[i].end);
	}

	return vectorMap.walls;
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
	// Safe zone tolerance ensures that elements directly within the middle of the map are safe.
	const SAFE_ZONE_TOLERANCE = 0.0000001;

	const newElements = [];

	const [lA, lB, lC] = sliceLine.standard;
	const isPointSafe = point => (point.y - SAFE_ZONE_TOLERANCE) >= (lC - (lA * (point.x - SAFE_ZONE_TOLERANCE))) / lB;

	for (let i = elements.length - 1; i >= 0; i--) {
		let intersection;

		// Detect if both ends of a segment are inside the safe-zone.
		if(elements[i].constructor.name === "Segment") {
			if(isPointSafe(elements[i].start) && isPointSafe(elements[i].end)) {
				newElements.push(elements[i]);
			} else if(intersection = elements[i].intersect(sliceLine)){ // If the segment intersects with the safe-zone border, slice it inhalf.
				if(intersection.length === 0) continue;

				let slicedSegments = elements[i].split(intersection[0]);
				// Finds the segment that is on the safe side
				let safeSlice = slicedSegments.find(s => s && (
					isPointSafe(s.start) && isPointSafe(s.end)
				));

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

VectorUtilities.getMinVectorFromElements = elements => {
	let minVector = new Vector(Infinity, Infinity);
	const points = VectorUtilities.elementsToPoints(elements);

	for (let i = points.length - 1; i >= 0; i--) minVector = GeometryUtilities.minVector(
		points[i],
		minVector
	);

	return GeometryUtilities.roundPoint(new Vector(minVector.x, minVector.y));
};

VectorUtilities.getMaxVectorFromElements = elements => {
	let maxVector = new Vector(0, 0);

	const points = VectorUtilities.elementsToPoints(elements);

	for (let i = points.length - 1; i >= 0; i--) maxVector = GeometryUtilities.maxVector(
		points[i],
		maxVector
	);

	return GeometryUtilities.roundPoint(new Vector(maxVector.x, maxVector.y));
};

VectorUtilities.mirrorVectorElements = (elements, mirrorFunc, settings={}) => {
	const newElements = [];

	for (let i = elements.length - 1; i >= 0; i--) {
		let element = elements[i];

		if(settings.duplicate) newElements.push(element);
		if(element.constructor.name === "Segment") {
			const mirrorStart = mirrorFunc(element.start);
			const mirrorEnd = mirrorFunc(element.end);

			// Centered Element Check
			if(
				GeometryUtilities.pointsEqualTo(mirrorStart, element.start) &&
				GeometryUtilities.pointsEqualTo(mirrorEnd, element.end)
			) continue;
			
			for (let i = mirrorStart.length - 1; i >= 0; i--) newElements.push(
				new Segment(mirrorStart[i], mirrorEnd[i])
			);
		} else if(element.point) {
			const mirrorPoints = mirrorFunc(element.point);
			// Centered Element Check
			if(
				GeometryUtilities.pointsEqualTo(mirrorPoints, element.point)
			) continue;

			let newTeam;
			if(element.team) newTeam = element.team === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;

			for (let i = mirrorPoints.length - 1; i >= 0; i--) {
				const newElement = elements[i].clone();
				newElement.point = mirrorPoints[i];
				if(newTeam) newElement.team = newTeam;

				newElements.push(newElement);
			}
		} else if(element.constructor.name === "Point") {
			const mirrorPoints = mirrorFunc(element);
			// Centered Element Check
			if(
				GeometryUtilities.pointsEqualTo(mirrorPoints, element)
			) continue;

			for (let i = mirrorPoints.length - 1; i >= 0; i--) newElements.push(mirrorPoints[i]);
		}
	}

	return newElements;
};

VectorUtilities.getSliceLineFromSymmetry = ({width, height}, symmetry) => {
	if(symmetry === SYMMETRY.ROTATIONAL) {
		return new Line(new Point(0, height), new Point(width, 0));
	} else if(symmetry === SYMMETRY.HORIZONTAL) {
		return new Line(new Point(width / 2, 0), new Point(width / 2, height));
	} else if(symmetry === SYMMETRY.VERTICAL) {
		return new Line(new Point(0, height / 2), new Point(width, height / 2));
	}

	return new Line(new Point(0, 0), new Point(1, 0));
};

VectorUtilities.getClosestSymmetricRelationshipBetweenElements = ({width, height}, elements) => {
	const symmetryNames = Object.keys(SYMMETRY);
	let symmetryScore = symmetryNames.reduce((acc, val) => ({
		...acc,
		[val]: 0
	}), {});

	const points = VectorUtilities.elementsToPoints(elements);
	const doesPointExist = p => points.some(p2 => p.equalTo(p2));

	for (let i = points.length - 1; i >= 0; i--) {
		const point = points[i];

		symmetryNames.forEach(sym => {
			if(
				SYMMETRY_FUNCTIONS[SYMMETRY[sym]]({width, height}, point).every(doesPointExist)
			) symmetryScore[sym]++;
		});
	}

	return SYMMETRY[
		symmetryNames.reduce(
			(highestScore, sym) => symmetryScore[sym] > highestScore[0] ? [symmetryScore[sym], sym] : highestScore
		, [0, "ASYMMETRIC"])[1]
	];
};

module.exports = VectorUtilities;