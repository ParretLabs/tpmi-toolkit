const { Point, Segment, Vector, Box } = require('@flatten-js/core');

const Utilities = require('../utils/Utilities');
const VectorUtilities = require('../utils/VectorUtilities');
const MapUtilities = require('../utils/MapUtilities');

const { NEIGHBOR_VECTORS, SYMMETRY, SYMMETRY_FUNCTIONS } = require('../CONSTANTS');

module.exports = Vectorizer => {
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

			for (let i = currentLines.length - 1; i >= 0; i--) {
				let traceResults = Vectorizer.traceLinesFromPoint(wallMap, currentLines[i].segment.end, settings);

				newLines = newLines.concat(traceResults);
			}

			newLines.forEach(l => {
				l.segment.branch = branchTracker;
			});

			lines = lines.concat(newLines);

			if(newLines.length > 0) traceMapFromLines(newLines, Utilities.incrementTracker(branchTracker), settings);
		}

		let mapWalls = lines.map(l => l.segment);

		// Fill in any loose ends.
		mapWalls = Vectorizer.fillWallHoles(mapWalls);

		// Symmetrize map walls
		const dimensions = {width: wallMap[0].length - 1, height: wallMap.length - 1};
		const symmetry = VectorUtilities.getClosestSymmetricRelationshipBetweenElements(
			dimensions, mapWalls
		);
		const sliceLine = VectorUtilities.getSliceLineFromSymmetry(dimensions, symmetry);

		const halvedWalls = VectorUtilities.sliceVectorElements(mapWalls, sliceLine);
		const mirroredWalls = VectorUtilities.mirrorVectorElements(
			halvedWalls, p => SYMMETRY_FUNCTIONS[symmetry](dimensions, p), { duplicate: true }
		);

		const filledWalls = Vectorizer.fillWallHoles(mirroredWalls);
		// const reframedWalls = Vectorizer.reframeWalls(filledWalls);

		return filledWalls;
	};

	/**
	 * Finds the neighbors of a point, then traces a line in that neighbors direction.
	 * @param  {Array[Array]}   wallMap - The map to traverse
	 * @param  {Point}          point - The point to start tracing at
	 * @return {Array[Segment]} An array of segments
	 */
	Vectorizer.traceLinesFromPoint = (wallMap, point, settings={}) => {
		if(MapUtilities.getTile(wallMap, point.x, point.y) === 0) return [];

		const NEIGHBOR_DETECTION_ORDER = [0, 2, 4, 6, 1, 3, 5, 7];
		const pointNeighbors = MapUtilities.getNeighbors(wallMap, point);
		const lines = [];

		const traceLine = (x, y) => Vectorizer.traceSingleLineFromPoint(wallMap, point, new Point(x, y));

		for (let i = pointNeighbors.length - 1; i >= 0; i--) {
			const neighborIndex = NEIGHBOR_DETECTION_ORDER[i];

			if(settings.skipDiagonal && neighborIndex % 2 !== 0) continue;

			if(pointNeighbors[neighborIndex] === 1) lines.push(traceLine(
				NEIGHBOR_VECTORS[neighborIndex].x,
				NEIGHBOR_VECTORS[neighborIndex].y
			));
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
};