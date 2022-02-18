// Second-level Utility (Can only require first-level utilities)
// For working with tile-based maps

const PNGImage = require('pngjs-image');
const { Point } = require('@flatten-js/core');

const { TILE_COLORS, TILE_IDS } = require('../CONSTANTS');
const Utilities = require('./Utilities');

let MapUtilities = {};

MapUtilities.mapIDToTileMap = (mapID) => {
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

MapUtilities.tileMapToWallMap = tileMap => {
	const WALL_TYPES = [
		TILE_IDS.WALL,
		TILE_IDS.TLWALL,
		TILE_IDS.TRWALL,
		TILE_IDS.BLWALL,
		TILE_IDS.BRWALL
	];
	let wallMap = Utilities.createEmpty2dArray(tileMap[0].length, tileMap.length);

	for (let y = 0; y < wallMap.length; y++) {
		for (let x = 0; x < wallMap[0].length; x++) {
			if(WALL_TYPES.includes(tileMap[y][x])) wallMap[y][x] = 1;
		}
	}

	wallMap = MapUtilities.getEssentialWalls(wallMap);

	return wallMap;
};

MapUtilities.getEssentialWalls = map => {
	let essentialWallMap = Utilities.createEmpty2dArray(map[0].length, map.length);

	let floorPoint = new Point(0, 0);
	let touchedWall = false;

	// Search diagonally for a wall, then keep searching diagonally until an empty tile is found.
	for(let distance = 0; distance < map[0].length; distance++) {
		if(MapUtilities.getTile(map, distance, distance) === 0 && touchedWall) {
			floorPoint.x = distance;
			floorPoint.y = distance;

			break;
		} else if(MapUtilities.getTile(map, distance, distance) === 1) {
			touchedWall = true;
		}
	}

	floodFillHelper(floorPoint.x, floorPoint.y);

	function floodFillHelper(pos_x, pos_y) {
		if(MapUtilities.getTile(map, pos_x, pos_y) === null) return;

		if(map[pos_y][pos_x] === 2) return;
		if(map[pos_y][pos_x] === 1) {
			essentialWallMap[pos_y][pos_x] = 1;
			return;
		}

		map[pos_y][pos_x] = 2;
		
		floodFillHelper(pos_x + 1, pos_y);
		floodFillHelper(pos_x - 1, pos_y);
		floodFillHelper(pos_x, pos_y + 1);
		floodFillHelper(pos_x, pos_y - 1);
		
		return;
	}

	return essentialWallMap;
}

/**
 * Searches diagonally from the top left of the map until a wall is found.
 * @param  {Array[Array]} wallMap - The map to traverse
 * @return {Point|null}
 */
MapUtilities.diagonalWallSearch = wallMap => {
	for(let distance = 0; distance < wallMap[0].length; distance++) {
		if(MapUtilities.getTile(wallMap, distance, distance) === 1) {
			return new Point(distance, distance);
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