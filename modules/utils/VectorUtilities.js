// Third-Level Utility (Can access Second-level utilities)
// For working with VectorMaps

const { Point, Segment, Vector, Box, Line } = require('@flatten-js/core');

const { TILE_IDS, TEAMS, SYMMETRY, SYMMETRY_FUNCTIONS } = require('../CONSTANTS');
const Elements = require('../types/Elements');
const Utilities = require('./Utilities');
const GeometryUtilities = require('./GeometryUtilities');

let VectorUtilities = {};

// Flexible custom tilemap generator. 
VectorUtilities.tileMapGenerator = (_settings={}) => {
	const settings = {
		detectorSize: 1,
		mapWidth: 1,
		mapHeight: 1,
		detectorFilter: (point) => {},
		detectorMap: (point) => {},
		callback: (tileMap, point, detector) => {},
		..._settings
	};

	if(
		!Utilities.isSafeArrayLength(settings.mapWidth) ||
		!Utilities.isSafeArrayLength(settings.mapHeight)
	) throw new Error("Invalid tile map dimensions: " + JSON.stringify(settings));

	let tileMap = Utilities.createEmpty2dArray(settings.mapWidth, settings.mapHeight);
	let detectors = [];

	for (let y = 0; y < settings.mapHeight; y++) {
		for (let x = 0; x < settings.mapWidth; x++) {
			const centerPoint = new Point(x, y);
			if(!settings.detectorFilter(centerPoint)) continue;

			const tileBoxDetector = settings.detectorMap(centerPoint) ?? GeometryUtilities.createDetector(centerPoint, {
				size: settings.detectorSize
			});
			tileBoxDetector.centerPoint = centerPoint;

			detectors.push(tileBoxDetector);
		}
	}

	for (let i = 0; i < detectors.length; i++) {
		const value = settings.callback(tileMap, detectors[i].centerPoint, detectors[i], detectors);

		if(typeof value !== "undefined") {
			tileMap[detectors[i].centerPoint.y][detectors[i].centerPoint.x] = value;
		}
	}

	return {
		tileMap,
		detectors,
	};
};

// Converts an array of element arrays into a singular planar set.
VectorUtilities.generatePlanarSetFromElements = (...elementArrays) => {
	let shapes = [
		...[...elementArrays.map(a => a.map(e => e.shape))]
	].flat();
	
	return GeometryUtilities.createPlanarSet(shapes);
};

VectorUtilities.generatePlanarSetsFromVectorMap = vectorMap => {
	let planarSets = {};

	// Puts all impassable-type element shapes into a planar set
	planarSets.immpassable = VectorUtilities.generatePlanarSetFromElements(
		[vectorMap.elements.outerWall],
		vectorMap.elements.islands,
		vectorMap.elements.spikes
	);

	// Puts all semipassable-type element shapes into a planar set
	planarSets.semipassable = VectorUtilities.generatePlanarSetFromElements(
		vectorMap.elements.flags,
		vectorMap.elements.bombs,
		vectorMap.elements.boosts,
		vectorMap.elements.gates
	);

	// Puts all element shapes into a planar set
	planarSets.all = VectorUtilities.generatePlanarSetFromElements(
		[vectorMap.elements.outerWall],
		vectorMap.elements.islands,
		vectorMap.elements.spikes,
		vectorMap.elements.flags,
		vectorMap.elements.bombs,
		vectorMap.elements.boosts,
		vectorMap.elements.buttons,
		vectorMap.elements.powerups,
		vectorMap.elements.gates
	);

	return planarSets;
};

// Moves all wall elements at a point to another point.
VectorUtilities.translateWallsAtPoint = (wallElements, oldPoint, newPoint) => {
	let affectedWallElements = {};

	for (let i = wallElements.length - 1; i >= 0; i--) {
		const segmentHash = GeometryUtilities.hashSegment(wallElements[i].shape);

		if(wallElements[i].shape.start.equalTo(oldPoint) && !newPoint.equalTo(wallElements[i].shape.start)) {
			wallElements[i].shape = new Segment(newPoint, wallElements[i].shape.end);
			const newSegmentHash = GeometryUtilities.hashSegment(wallElements[i].shape);

			affectedWallElements[segmentHash] = true;
			affectedWallElements[newSegmentHash] = true;
		}
		if(wallElements[i].shape.end.equalTo(oldPoint) && !newPoint.equalTo(wallElements[i].shape.end)) {
			wallElements[i].shape = new Segment(wallElements[i].shape.start, newPoint);
			const newSegmentHash = GeometryUtilities.hashSegment(wallElements[i].shape);
			
			affectedWallElements[segmentHash] = true;
			affectedWallElements[newSegmentHash] = true;
		}
	}

	return affectedWallElements;
};

VectorUtilities.getFlagPair = flags => [
	flags.find(a => a.team === TEAMS.RED) || null,
	flags.find(a => a.team === TEAMS.BLUE) || null
];

VectorUtilities.elementsToPoints = elements => elements.reduce((acc, elem) => {
	return acc.concat(elem.toPoints());
}, []);

VectorUtilities.roundElementPositions = elements => {
	for (let i = elements.length - 1; i >= 0; i--) elements[i].round();
	return elements;
};

VectorUtilities.getVectorPointElementsFromTileMap = tileMap => {
	let flags = [];
	let spikes = [];
	let bombs = [];
	let boosts = [];
	let powerups = [];
	let buttons = [];

	for (let y = 0; y < tileMap.length; y++) {
		for (let x = 0; x < tileMap[0].length; x++) {
			const isTile = id => tileMap[y][x] === id;

			if(isTile(TILE_IDS.REDFLAG)) flags.push(new Elements.Flag({x, y}, TEAMS.RED));
			else if(isTile(TILE_IDS.BLUEFLAG)) flags.push(new Elements.Flag({x, y}, TEAMS.BLUE));
			else if(isTile(TILE_IDS.SPIKE)) spikes.push(new Elements.Spike({x, y}));
			else if(isTile(TILE_IDS.BOMB)) bombs.push(new Elements.Bomb({x, y}));
			else if(isTile(TILE_IDS.BOOST)) boosts.push(new Elements.Boost({x, y}, TEAMS.NONE));
			else if(isTile(TILE_IDS.BUTTON)) buttons.push(new Elements.Button({x, y}));
			else if(isTile(TILE_IDS.REDBOOST)) boosts.push(new Elements.Boost({x, y}, TEAMS.RED));
			else if(isTile(TILE_IDS.BLUEBOOST)) boosts.push(new Elements.Boost({x, y}, TEAMS.BLUE));
			else if(isTile(TILE_IDS.POWERUP)) powerups.push(new Elements.Powerup({x, y}));
		}
	}

	return { flags, spikes, bombs, boosts, powerups, buttons };
};

// Iterates through all elements in an array
// If the callback function returns "true", the iterator will stop.
VectorUtilities.iterateElements = (elements, func) => {
	if(typeof func !== "function") throw new Error("Invalid iteration function");

	for (let i = elements.length - 1; i >= 0; i--) {
		let response = func(
			elements[i], // Element object
			elements[i].shape, // Flatten-js shape object
			elements[i].shapeType // Flatten-js shape type
		);

		if(response) break;
	}

	return elements;
};

VectorUtilities.sliceVectorElements = (elements, sliceLine) => {
	// Safe zone tolerance ensures that elements directly within the middle of the map are safe.
	const SAFE_ZONE_TOLERANCE = 0.0000001;

	const newElements = [];

	const [lA, lB, lC] = sliceLine.standard;
	const isPointSafe = point => (point.y - SAFE_ZONE_TOLERANCE) >= (lC - (lA * (point.x - SAFE_ZONE_TOLERANCE))) / lB;

	VectorUtilities.iterateElements(elements, (elem, shape, shapeType) => {
		let intersection;

		if(shapeType === "Segment") {
			if(isPointSafe(shape.start) && isPointSafe(shape.end)) {
				newElements.push(elem);
			} else if(intersection = shape.intersect(sliceLine)){ // If the segment intersects with the safe-zone border, slice it inhalf.
				if(intersection.length === 0) return;

				let slicedSegments = shape.split(intersection[0]);
				// Finds the segment that is on the safe side
				let safeSlice = slicedSegments.find(s => s && (
					isPointSafe(s.start) && isPointSafe(s.end)
				));

				if(safeSlice) newElements.push(elem.clone().update({
					shape: safeSlice
				}));
			}
		} else if(shapeType === "Point") {
			if(isPointSafe(shape)) newElements.push(elem);
		}
	});

	return newElements;
};

VectorUtilities.getMinVectorFromElements = elements => {
	const points = VectorUtilities.elementsToPoints(elements);
	let minVector = points[0];
	if(!minVector) return new Vector(0, 0);

	for (let i = points.length - 1; i >= 0; i--) minVector = GeometryUtilities.minVector(
		points[i],
		minVector
	);

	return Utilities.roundPoint(new Vector(minVector.x, minVector.y));
};

VectorUtilities.getMaxVectorFromElements = elements => {
	const points = VectorUtilities.elementsToPoints(elements);
	let maxVector = points[0];
	if(!maxVector) return new Vector(0, 0);

	for (let i = points.length - 1; i >= 0; i--) maxVector = GeometryUtilities.maxVector(
		points[i],
		maxVector
	);

	return Utilities.roundPoint(new Vector(maxVector.x, maxVector.y));
};

// Translates all elements in an array
VectorUtilities.translateElements = (elements, vector) => {
	VectorUtilities.iterateElements(elements, elem => {
		elem.translate(vector);
	});

	return elements;
};

VectorUtilities.mirrorVectorElements = (elements, mirrorFunc, settings={}) => {
	const newElements = [];

	VectorUtilities.iterateElements(elements, (elem, shape, shapeType) => {
		let updateObj = {};

		if(settings.duplicate) newElements.push(elem);
		if(elem.team) updateObj.team = elem.team === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;

		if(shapeType === "Segment") {
			const mirrorStart = mirrorFunc(shape.start);
			const mirrorEnd = mirrorFunc(shape.end);

			// Centered Element Check
			if(
				GeometryUtilities.pointsEqualTo(mirrorStart, shape.start) &&
				GeometryUtilities.pointsEqualTo(mirrorEnd, shape.end)
			) return;
			
			for (let i = mirrorStart.length - 1; i >= 0; i--) {
				updateObj.shape = new Segment(mirrorStart[i], mirrorEnd[i]);
				newElements.push(elem.clone().update(updateObj));
			}
		} else if(shapeType === "Point") {
			const mirrorPoints = mirrorFunc(shape);

			// Centered Element Check
			if(
				GeometryUtilities.pointsEqualTo(mirrorPoints, shape)
			) return;

			for (let i = mirrorPoints.length - 1; i >= 0; i--) {
				updateObj.shape = new Point(mirrorPoints[i].x, mirrorPoints[i].y);
				newElements.push(elem.clone().update(updateObj));
			}
		}
	});

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
	const pointMap = points.reduce((acc, p) => ({
		...acc,
		[`${Math.floor(p.x)},${Math.floor(p.y)}`]: true
	}), {});
	const doesPointExist = p => pointMap[`${Math.floor(p.x)},${Math.floor(p.y)}`] || false;

	for (let i = points.length - 1; i >= 0; i--) {
		const point = points[i];

		symmetryNames.forEach(sym => {
			const mirroredPoints = SYMMETRY_FUNCTIONS[SYMMETRY[sym]]({width, height}, point);
			if(mirroredPoints.every(doesPointExist)) symmetryScore[sym]++;
		});
	}

	return SYMMETRY[
		symmetryNames.reduce(
			(highestScore, sym) => symmetryScore[sym] > highestScore[0] ? [symmetryScore[sym], sym] : highestScore
		, [0, "ASYMMETRIC"])[1]
	];
};

module.exports = VectorUtilities;