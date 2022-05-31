const TestUtils = {};

const fs = require('fs');
const writeFile = fs.promises.writeFile;
const MapUtilities = require("../modules/utils/MapUtilities");

TestUtils.Visualizer = function(title) {
	this.title = title;

	this.writeVisualFile = async (name, data) => {
		return await writeFile(__dirname + '/visuals/' + title + '_' + name + '.html', data);
	};

	return this;
}

TestUtils.getTestMaps = () => new Promise(async (resolve) => {
	const fileMap = id => MapUtilities.fileToTileMap(__dirname + '/maps/' + id + '.png');
	const mapID = id => MapUtilities.mapIDToTileMap(id);

	const MAP_DATA = new Map([
		['EMERALD', await fileMap(74440)],
		['Willow', await mapID(74490)],
		['Oak', await mapID(74459)],
		['Half Oak', await mapID(74694)],
		['Jardim', await mapID(74461)],
		['Some Ring', await mapID(74454)],
	]);

	const WALL_MAP_DATA = new Map();
	const IMPASSABLE_MAP_DATA = new Map();

	for (const [name, tileMap] of MAP_DATA) {
		WALL_MAP_DATA.set(name, MapUtilities.tileMapToWallMap(tileMap));
		IMPASSABLE_MAP_DATA.set(name, MapUtilities.tileMapToImpassableMap(tileMap));
	}

	resolve({MAP_DATA, WALL_MAP_DATA, IMPASSABLE_MAP_DATA});
});

module.exports = TestUtils;