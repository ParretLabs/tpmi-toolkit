const { Point, Segment, Vector, Box } = require('@flatten-js/core');

const Utilities = require('./utils/Utilities');
const VectorUtilities = require('./utils/VectorUtilities');
const MapUtilities = require('./utils/MapUtilities');
const GeometryUtilities = require('./utils/GeometryUtilities');
const VisualUtilities = require('./utils/VisualUtilities');

const { NEIGHBOR_VECTORS, SYMMETRY, TILE_IDS } = require('./SETTINGS');

let Vectorizer = {};

Vectorizer.VectorMap = class VectorMap {
	constructor({
		walls
	}) {
		this.size = null;
		this.walls = walls;

		this.pathFindingMap = null;

		this.normalize();
	}

	get width() {return this.size.x;}
	get height() {return this.size.y;}

	clone() {
		return new Vectorizer.VectorMap({
			walls: this.walls.map(w => w.clone())
		});
	}

	setWalls(walls, disableNormalization) {
		this.walls = walls;
		if(!disableNormalization) this.normalize();
	}

	normalize() {
		VectorUtilities.roundMapPositions(this);
		Vectorizer.reframeMap(this);
		this.size = VectorUtilities.calculateMapSize(this);
	}

	symmetrize(symmetry) {
		// Normalization is disabled so the dimensions stay the same.
		// This is required so that the mirroring is accurate.
		Vectorizer.sliceMap(this, symmetry, true);
		Vectorizer.mirrorMap(this, symmetry);
		this.setWalls(Vectorizer.fillWallHoles(this.walls));

		return this;
	}

	tileMap() {
		return Vectorizer.createTileMapFromVectorMap(this).tileMap;
	}

	visualize() {
		return VisualUtilities.visualizeVectorMap(this);
	}
};

Vectorizer.createVectorMapFromTileMap = tileMap => {
	const wallMap = MapUtilities.tileMapToWallMap(tileMap);

	let vectorMap = new Vectorizer.VectorMap({
		walls: Vectorizer.getLinesFromWallMap(wallMap)
	});

	return vectorMap;
};

Vectorizer.createTileMapFromVectorMap = vectorMap => {
	let {tileMap, detectors} = VectorUtilities.tileMapGenerator({
		detectorSize: 0.9,
		mapWidth: vectorMap.width + 1,
		mapHeight: vectorMap.height + 1,
		callback: (tileMap, point, detector) => {
			for (let i = vectorMap.walls.length - 1; i >= 0; i--) {
				if(
					vectorMap.walls[i].intersect(detector).length ||
					vectorMap.walls[i].start.equalTo(point)
				) {
					tileMap[point.y][point.x] = TILE_IDS.WALL;
					break;
				}
			}
		}
	});

	return {tileMap, detectors};
};

// Slices a vector map in half
Vectorizer.sliceMap = (vectorMap, symmetry, disableDimensionRecalculation) => {
	const mapWalls = vectorMap.walls;
	const newMapWalls = [];

	if(symmetry === SYMMETRY.ROTATIONAL) {
		// Rotational Symmetry Slicing function
		// https://www.desmos.com/calculator/vvd4ga5com
		const isPointSafe = point => ((vectorMap.height / vectorMap.width) * point.x) + point.y < vectorMap.height;
		const sliceLine = new Segment(new Point(0, vectorMap.height), new Point(vectorMap.width, 0));

		for (let i = mapWalls.length - 1; i >= 0; i--) {
			let intersection;

			// Detect if both ends of a segment are inside the safe-zone.
			if(isPointSafe(mapWalls[i].start) && isPointSafe(mapWalls[i].end)) {
				newMapWalls.push(mapWalls[i]);
			} else if(intersection = mapWalls[i].intersect(sliceLine)){
				// If the segment intersects with the safe-zone border, slice it inhalf.
				if(intersection.length === 0) continue;

				let slicedSegments = mapWalls[i].split(intersection[0]);
				let safeSlice = slicedSegments.find(s => s && (isPointSafe(s.start) || isPointSafe(s.end)));

				if(safeSlice) newMapWalls.push(safeSlice);

				// console.log("sliced", mapWalls[i], slicedSegments, safeSlice);
			}
		}
	}

	vectorMap.setWalls(newMapWalls, disableDimensionRecalculation);

	return newMapWalls;
};

// Mirrors a map
Vectorizer.mirrorMap = (vectorMap, symmetry) => {
	const mapWalls = vectorMap.walls;
	const newMapWalls = [];

	if(symmetry === SYMMETRY.ROTATIONAL) {
		for (let i = mapWalls.length - 1; i >= 0; i--) {
			const segment1 = mapWalls[i].clone();
			const segment2 = mapWalls[i].clone();

			segment2.start.x = vectorMap.width - segment2.start.x;
			segment2.start.y = vectorMap.height - segment2.start.y;

			segment2.end.x = vectorMap.width - segment2.end.x;
			segment2.end.y = vectorMap.height - segment2.end.y;

			newMapWalls.push(segment1);
			newMapWalls.push(segment2);
		}
	}

	vectorMap.setWalls(newMapWalls);

	return newMapWalls;
};

// Pushes elements with negative positions back into the positive positions.
Vectorizer.reframeMap = vectorMap => {
	let translationVector = new Vector(0, 0);

	for (let i = vectorMap.walls.length - 1; i >= 0; i--) translationVector = GeometryUtilities.minVector(
		vectorMap.walls[i].start, 
		vectorMap.walls[i].end,
		translationVector
	);

	translationVector = new Vector(Math.abs(translationVector.x), Math.abs(translationVector.y));

	for (let i = vectorMap.walls.length - 1; i >= 0; i--) {
		vectorMap.walls[i] = vectorMap.walls[i].translate(translationVector);
	}

	return vectorMap.walls;
};

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

/**
 * Traces a WallMap using lines.
 * @param  {Array[Array]} wallMap
 * @return {Array[Segment]}
 */
Vectorizer.getLinesFromWallMap = wallMap => {
	let lines = [];

	for (let y = wallMap.length - 1; y >= 0; y--) {
		for (let x = wallMap[0].length - 1; x >= 0; x--) {
			if(MapUtilities.getTile(wallMap, x, y) === 1) {
				let startLines = Vectorizer.traceLinesFromPoint(wallMap, new Point(x, y));
				lines = lines.concat(startLines);

				traceMapFromLines(startLines, String(Utilities.hashNumberArray([x, y])) + "-0");
			}
		}
	}

	// Recursive Tracing Function
	// It is first called using an array of starting segments traced from the starting wall point.
	// All the endpoints of the segments in the array are used as starting points to trace new lines.
	// Those new lines are then fed into the function again to repeat the process.
	// This results in a sort of branching pattern where the end of the last segments are used for the beginning of more.
	function traceMapFromLines(currentLines, branchTracker, settings) {
		let newLines = [];

		// console.log(currentLines.length);

		for (let i = currentLines.length - 1; i >= 0; i--) {
			// console.log(currentLines[i]);
			// console.log(currentLines[i].segment.end, MapUtilities.getTile(wallMap, currentLines[i].segment.end.x, currentLines[i].segment.end.y));

			let traceResults = Vectorizer.traceLinesFromPoint(wallMap, currentLines[i].segment.end, settings);

			newLines = newLines.concat(traceResults);
		}

		newLines.forEach(l => {
			l.segment.branch = branchTracker;
		});

		lines = lines.concat(newLines);

		if(newLines.length > 0) traceMapFromLines(newLines, Utilities.incrementTracker(branchTracker), settings);
	}

	let walls = lines.map(l => l.segment);

	// Fill in any loose ends.
	let mapWalls = Vectorizer.fillWallHoles(walls);

	return mapWalls;
};

/**
 * Finds the neighbors of a point, then traces a line in that neighbors direction.
 * @param  {Array[Array]}   wallMap - The map to traverse
 * @param  {Point}          point - The point to start tracing at
 * @return {Array[Segment]} An array of segments
 */
Vectorizer.traceLinesFromPoint = (wallMap, point, settings={}) => {
	if(MapUtilities.getTile(wallMap, point.x, point.y) === 0) return [];

	const pointNeighbors = MapUtilities.getNeighbors(wallMap, point);
	const lines = [];

	const traceLine = (x, y) => Vectorizer.traceSingleLineFromPoint(wallMap, point, new Point(x, y));

	for (let i = pointNeighbors.length - 1; i >= 0; i--) {
		if(settings.skipDiagonal && [1, 3, 5, 7].includes(i)) continue;

		if(pointNeighbors[i] === 1) lines.push(traceLine(NEIGHBOR_VECTORS[i].x, NEIGHBOR_VECTORS[i].y));
	}

	let filteredLines = lines.filter(a => a !== null);

	// If there are no neighbors around this tile and this tile is a wall, then return a 0 length segment.
	// Exists so that "pizza blocks" still get registered.
	if(
		filteredLines.length === 0 &&
		pointNeighbors.every(n => n === 0 || n === 2) &&
		MapUtilities.getTile(wallMap, point.x, point.y) === 1
	) {
		// Mark point as seen
		MapUtilities.setTile(wallMap, point.x, point.y, 2);

		return [{segment: new Segment(point, point)}];
	} else return filteredLines;
};

/**
 * Traces a line from a point into a direction until an empty tile is found. WallMaps are mutated by this function.
 * @param  {Array[Array]} wallMap - The map to traverse
 * @param  {Point} startPoint - The point to start tracing at
 * @param  {Vector} direction - A vector that indicates the direction of the line
 * @return {Segment}
 */
Vectorizer.traceSingleLineFromPoint = (wallMap, startPoint, direction) => {
	let endPoint = startPoint.clone();

	while(true) {
		// console.log(endPoint, direction, MapUtilities.getTile(wallMap, endPoint.x, endPoint.y));
		
		// Mark point as seen
		MapUtilities.setTile(wallMap, endPoint.x, endPoint.y, 2);

		// Move to the next point
		endPoint.x += direction.x;
		endPoint.y += direction.y;

		if(
			!MapUtilities.getTile(wallMap, endPoint.x, endPoint.y) ||
			MapUtilities.getTile(wallMap, endPoint.x, endPoint.y) === 2
		) break;
	}

	endPoint.x -= direction.x;
	endPoint.y -= direction.y;

	let segment = new Segment(startPoint, endPoint);

	return {segment};
};

module.exports = Vectorizer;