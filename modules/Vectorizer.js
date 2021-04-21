const cheerio = require('cheerio');
const { Point, Segment, Vector } = require('@flatten-js/core');
const MapUtilities = require('./utils/MapUtilities');

let Vectorizer = {};

Vectorizer.VectorMap = class VectorMap {
	constructor({
		size,
		walls
	}) {
		this.size = size;
		this.walls = walls;
	}

	visualize() {
		const wallSVG = this.walls.map(w => w.svg()).join("");

		let rawSVG = `<svg>${wallSVG}</svg>`;
		let $svg = cheerio.load(rawSVG);

		$svg("line").attr("stroke-linecap", "round");

		$svg("svg").attr("viewBox", `0 0 ${this.size.x} ${this.size.y}`);

		return $svg.html();
	}
};

Vectorizer.createVectorMapFromTileMap = tileMap => {
	const wallMap = MapUtilities.tileMapToWallMap(tileMap);

	let vectorMap = new Vectorizer.VectorMap({
		size: new Vector(tileMap[0].length, tileMap.length),
		walls: Vectorizer.getLinesFromWallMap(wallMap)
	});

	return vectorMap;
};

/**
 * Traces a WallMap using lines.
 * @param  {Array[Array]} wallMap
 * @return {Array[Segment]}
 */
Vectorizer.getLinesFromWallMap = wallMap => {
	let lines = [];
	// Find the starting point
	const wallPoint = MapUtilities.diagonalWallSearch(wallMap);

	if(!wallPoint) return [];

	traceMapOutlineFromLines(Vectorizer.traceLinesFromPoint(wallMap, wallPoint));

	for (let y = wallMap.length - 1; y >= 0; y--) {
		for (let x = wallMap[0].length - 1; x >= 0; x--) {
			if(MapUtilities.getTile(wallMap, x, y) === 1) {
				traceMapOutlineFromLines(Vectorizer.traceLinesFromPoint(wallMap, new Point(x, y)));
				// console.log("monke", new Point(x, y));
			}
		}
	}

	// Recursive Tracing Function
	// It is first called using an array of starting segments traced from the starting wall point.
	// All the endpoints of the segments in the array are used as starting points to trace new lines.
	// Those new lines are then fed into the function again to repeat the process.
	// This results in a sort of branching pattern where the end of the last segments are used for the beginning of more.
	function traceMapOutlineFromLines(currentLines) {
		let newLines = [];
		let seenPoints = [];

		// console.log(currentLines.length);

		for (let i = currentLines.length - 1; i >= 0; i--) {
			// console.log(currentLines[i]);
			// console.log(currentLines[i].segment.end, MapUtilities.getTile(wallMap, currentLines[i].segment.end.x, currentLines[i].segment.end.y));

			let traceResults = Vectorizer.traceLinesFromPoint(wallMap, currentLines[i].segment.end);

			newLines = newLines.concat(traceResults);
			seenPoints = seenPoints.concat(...(traceResults.map(t => t.seenPoints)));
		}

		lines = lines.concat(newLines);

		// Mark seen points as seen on the wall map
		for (let i = seenPoints.length - 1; i >= 0; i--) MapUtilities.setTile(wallMap, seenPoints[i].x, seenPoints[i].y, 2);

		if(newLines.length > 0) traceMapOutlineFromLines(newLines);
	}

	return lines.map(l => l.segment);
};

/**
 * Finds the neighbors of a point, then traces a line in that neighbors direction.
 * @param  {Array[Array]}   wallMap - The map to traverse
 * @param  {Point}          point - The point to start tracing at
 * @return {Array[Segment]} An array of segments
 */
Vectorizer.traceLinesFromPoint = (wallMap, point) => {
	const pointNeighbors = MapUtilities.getNeighbors(wallMap, point);
	const lines = [];

	const traceLine = (x, y) => Vectorizer.traceSingleLineFromPoint(wallMap, point, new Point(x, y));

	// Top, Right, Bottom, Left
	if(pointNeighbors[0] === 1) lines.push(traceLine(0, -1));
	if(pointNeighbors[2] === 1) lines.push(traceLine(1, 0));
	if(pointNeighbors[4] === 1) lines.push(traceLine(0, 1));
	if(pointNeighbors[6] === 1) lines.push(traceLine(-1, 0));
	
	// Top Left, Top Right, Bottom Left, Bottom Right
	if(pointNeighbors[7] === 1) lines.push(traceLine(-1, -1));
	if(pointNeighbors[1] === 1) lines.push(traceLine(1, -1));
	if(pointNeighbors[5] === 1) lines.push(traceLine(-1, 1));
	if(pointNeighbors[3] === 1) lines.push(traceLine(1, 1));

	let filteredLines = lines.filter(a => a !== null);
	if(
		filteredLines.length === 0 &&
		MapUtilities.getTile(wallMap, point.x, point.y) === 1 &&
		pointNeighbors.every(n => n === 0)
	) {
		return [{segment: new Segment(point, point), seenPoints: [point.clone()]}];
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
	let seenPoints = [];

	while(true) {
		// console.log(endPoint, direction, MapUtilities.getTile(wallMap, endPoint.x, endPoint.y));
		
		// Move to the next point
		endPoint.x += direction.x;
		endPoint.y += direction.y;

		if(!MapUtilities.getTile(wallMap, endPoint.x, endPoint.y) || MapUtilities.getTile(wallMap, endPoint.x, endPoint.y) === 2) break;

		// Mark point as seen
		seenPoints.push(endPoint.clone());
	}

	endPoint.x -= direction.x;
	endPoint.y -= direction.y;

	let segment = new Segment(startPoint, endPoint);

	return {segment, seenPoints};
};

module.exports = Vectorizer;