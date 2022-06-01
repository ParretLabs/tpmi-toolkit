// Second-level Utility (Can only require first-level utilities)
// For working with tile-based maps

const PNGImage = require('pngjs-image');
const { Point } = require('@flatten-js/core');

const { TILE_COLORS, TILE_IDS, SYMMETRY_FUNCTIONS } = require('../CONSTANTS');
const Utilities = require('./Utilities');

let MapUtilities = {};

MapUtilities.mapIDToTileMap = (mapID) => {
	return new Promise((resolve, reject) => {
		let mapPNGLink = "https://fortunatemaps.herokuapp.com/png/" + mapID;
		PNGImage.readImage(mapPNGLink, (err, image) => {
			if(err) reject(err);

			let array = MapUtilities.imageToTileMap(image);

			if(!array) return reject("Couldn't resolve map data.");

			resolve(array);
		});
	}).catch(console.log);
}

MapUtilities.UMmapIDToTileMap = (mapID) => {
	return new Promise((resolve, reject) => {
		let mapPNGLink = "http://unfortunate-maps.jukejuice.com/download?mapname=map&type=png&mapid=" + mapID;
		PNGImage.readImage(mapPNGLink, (err, image) => {
			if(err) reject(err);

			let array = MapUtilities.imageToTileMap(image);

			if(!array) return reject("Couldn't resolve map data.");

			resolve(array);
		});
	}).catch(console.log);
}

MapUtilities.fileToTileMap = (mapFilePath) => {
	return new Promise((resolve, reject) => {
		PNGImage.readImage(mapFilePath, (err, image) => {
			if(err) reject(err);

			let array = MapUtilities.imageToTileMap(image);

			if(!array) return reject("Couldn't resolve map data.");

			resolve(array);
		});
	}).catch(console.log);
}

MapUtilities.imageToTileMap = image => {
	if(!image) return false;

	let width = image.getWidth();
	let height = image.getHeight();

	let buffer = Utilities.createEmpty2dArray(width, height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let tileType = TILE_COLORS.findIndex(a => {
				let tileRGB = Utilities.hexToRGB(image.getColor(x, y));
				return a.red === tileRGB[0] && a.green === tileRGB[1] && a.blue === tileRGB[2];
			});
			if(tileType === -1) {
				tileType = TILE_IDS.BACKGROUND;
			}

			buffer[y][x] = tileType;
		}
	}

	return buffer;
};

MapUtilities.createSpecificTileMap = (tileMap, types) => {
	let specificMap = Utilities.createEmpty2dArray(tileMap[0].length, tileMap.length);

	for (let y = 0; y < specificMap.length; y++) {
		for (let x = 0; x < specificMap[0].length; x++) {
			if(typeof types[(tileMap[y][x])] !== "undefined") specificMap[y][x] = types[(tileMap[y][x])];
		}
	}

	return specificMap;
};

MapUtilities.createIncludedTileMap = (tileMap, types) => {
	let specificMap = Utilities.createEmpty2dArray(tileMap[0].length, tileMap.length);

	for (let y = 0; y < specificMap.length; y++) {
		for (let x = 0; x < specificMap[0].length; x++) {
			if(types.includes(tileMap[y][x])) specificMap[y][x] = 1;
		}
	}

	return specificMap;
};

MapUtilities.tileMapToWallMap = tileMap => MapUtilities.createIncludedTileMap(tileMap, [
	TILE_IDS.WALL,
	TILE_IDS.TLWALL,
	TILE_IDS.TRWALL,
	TILE_IDS.BLWALL,
	TILE_IDS.BRWALL
]);

MapUtilities.tileMapToImpassableMap = tileMap => MapUtilities.createSpecificTileMap(tileMap, {
	[TILE_IDS.WALL]: TILE_IDS.WALL,
	[TILE_IDS.TLWALL]: TILE_IDS.TLWALL,
	[TILE_IDS.TRWALL]: TILE_IDS.TRWALL,
	[TILE_IDS.BLWALL]: TILE_IDS.BLWALL,
	[TILE_IDS.BRWALL]: TILE_IDS.BRWALL,
	[TILE_IDS.SPIKE]: TILE_IDS.SPIKE
});

/**
 * Creates new impassable map that only contains tiles that a player can touch.
 * @param  {Array[Array]} wallMap - The map to traverse
 * @return {Point|null}
 */
MapUtilities.getEssentialWalls = wallMap => {
	const handledMap = wallMap.map(a => Array(a.length).fill(0));
	let essentialWallMap = Utilities.createEmpty2dArray(wallMap[0].length, wallMap.length);

	// let floorTilePoint = MapUtilities.diagonalFloorSearch(wallMap, {x: 0, y: 0}, true);
	let floorTilePoint = MapUtilities.diagonalTileSearch(wallMap, 0, {x: 0, y: 0}, true);

	floodFillHelper(floorTilePoint.x, floorTilePoint.y);

	function floodFillHelper(pos_x, pos_y) {
		if(MapUtilities.getTile(essentialWallMap, pos_x, pos_y) === null) return;

		if(handledMap[pos_y][pos_x] === 1) return;
		if(wallMap[pos_y][pos_x] !== 0) {
			essentialWallMap[pos_y][pos_x] = wallMap[pos_y][pos_x];
			return;
		}

		handledMap[pos_y][pos_x] = 1;
		
		floodFillHelper(pos_x + 1, pos_y);
		floodFillHelper(pos_x - 1, pos_y);
		floodFillHelper(pos_x, pos_y + 1);
		floodFillHelper(pos_x, pos_y - 1);
		
		return;
	}

	return essentialWallMap;
}

/**
 * Searches diagonally from the top left of the map until a certain tile is found.
 * @param  {Array[Array]} wallMap - The map to traverse
 * @param  {number}       tileID  - The tile to search for
 * @param  {Point}        from    - direction to move from
 * @return {Point|null}
 */
MapUtilities.diagonalTileSearch = (map, tileID, from=({x: 0, y: 0}), fromCenter=false) => {
	const oppositeEnd = SYMMETRY_FUNCTIONS.R({width: map[0].length, height: map.length}, from)[0];
	let points = Utilities.getLinePointsAlt(from, oppositeEnd);

	if(fromCenter) {
		const center = points[Math.floor(points.length / 2)];
		points = points.sort((a, b) => center.distanceTo(a)[0] - center.distanceTo(b)[0]);
	}

	// Search diagonally for a wall, then keep searching diagonally until an empty tile is found.
	for (let i = 0; i < points.length; i++) {
		if(MapUtilities.getTile(map, points[i].x, points[i].y) === tileID) {
			return points[i];
		}
	}

	return null;
};

/**
 * Searches diagonally from the top left of the map until an inner floor tile is found.
 * @param  {Array[Array]} wallMap - The map to traverse
 * @return {Point|null}
 */
MapUtilities.diagonalFloorSearch = (wallMap, from=({x: 0, y: 0}), fromCenter=false) => {
	const oppositeEnd = SYMMETRY_FUNCTIONS.R({width: wallMap[0].length, height: wallMap.length}, from)[0];
	let points = Utilities.getLinePointsAlt(from, oppositeEnd);
	let touchedWall = false;

	if(fromCenter) {
		const center = points[Math.floor(points.length / 2)];
		points = points.sort((a, b) => center.distanceTo(a) - center.distanceTo(b));
	}

	// Search diagonally for a wall, then keep searching diagonally until an empty tile is found.
	for (let i = 0; i < points.length; i++) {
		if(touchedWall && MapUtilities.getTile(wallMap, points[i].x, points[i].y) === 0) {
			return points[i];
		} else if(MapUtilities.getTile(wallMap, points[i].x, points[i].y) !== 0) {
			touchedWall = true;
		}
	}

	return null;
};

/**
 * Searches diagonally from the top left of the map until a wall is found.
 * @param  {Array[Array]} wallMap - The map to traverse
 * @param  {Point}        from    - direction to move from
 * @return {Point|null}
 */
MapUtilities.diagonalWallSearch = (wallMap, from=({x: 0, y: 0})) => {
	const oppositeEnd = SYMMETRY_FUNCTIONS.R({width: wallMap[0].length, height: wallMap.length}, from)[0];
	const points = Utilities.getLinePointsAlt(from, oppositeEnd);

	for (let i = 0; i < points.length; i++) {
		if(MapUtilities.getTile(wallMap, points[i].x, points[i].y) !== 0) {
			return points[i];
		}
	}

	return null;
};

MapUtilities.getTile = (map, x, y) => y >= 0 && y < map.length ? (x >= 0 && x < map[0].length ? map[y][x] : null) : null;
MapUtilities.setTile = (map, x, y, val) => y >= 0 && y < map.length ? (x >= 0 && x < map[0].length ? (map[y][x] = val) : null) : null;

MapUtilities.getNeighbors = (map, point) => {
	// Ordered clock-wise: top, topright, right, bottomright, bottom, bottomleft, left, topleft
	return [
		MapUtilities.getTile(map, point.x, point.y - 1),
		MapUtilities.getTile(map, point.x + 1, point.y - 1),
		MapUtilities.getTile(map, point.x + 1, point.y),
		MapUtilities.getTile(map, point.x + 1, point.y + 1),
		MapUtilities.getTile(map, point.x, point.y + 1),
		MapUtilities.getTile(map, point.x - 1, point.y + 1),
		MapUtilities.getTile(map, point.x - 1, point.y),
		MapUtilities.getTile(map, point.x - 1, point.y - 1)
	]
};

module.exports = MapUtilities;