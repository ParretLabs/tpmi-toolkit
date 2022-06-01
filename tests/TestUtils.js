const TestUtils = {};

const fs = require('fs');
const writeFile = fs.promises.writeFile;
const MapUtilities = require("../modules/utils/MapUtilities");
let MAP_DATA = null;

TestUtils.Visualizer = function(title) {
	this.title = title;
	this.visualsPath = __dirname + '/visuals/' + title + '/';

	if(!fs.existsSync(this.visualsPath)) {
		fs.mkdirSync(this.visualsPath, { recursive: true });
	}

	this.writeVisualFile = async (name, data) => {
		return await writeFile(this.visualsPath + name + '.html', data);
	};

	return this;
}

TestUtils.getTestMaps = () => new Promise(async (resolve) => {
	const fileMap = id => MapUtilities.fileToTileMap(__dirname + '/maps/' + id + '.png');
	const mapID = id => MapUtilities.mapIDToTileMap(id);

	if(!MAP_DATA) {
		MAP_DATA = new Map([
			['EMERALD', await fileMap(74440)],
			['Willow', await mapID(74490)],
			['Oak', await mapID(74508)],
			['Half Oak', await mapID(74694)],
			['Jardim', await mapID(74461)],
			['Some Ring', await mapID(74454)],
			['Scorpio', await mapID(74456)],
			['Haste', await mapID(74460)],
			['Quadrinaros', await mapID(74665)],
		]);
	}

	const WALL_MAP_DATA = new Map();
	const IMPASSABLE_MAP_DATA = new Map();

	for (const [name, tileMap] of MAP_DATA) {
		WALL_MAP_DATA.set(name, MapUtilities.tileMapToWallMap(tileMap));
		IMPASSABLE_MAP_DATA.set(name, MapUtilities.tileMapToImpassableMap(tileMap));
	}

	resolve({MAP_DATA, WALL_MAP_DATA, IMPASSABLE_MAP_DATA});
});

module.exports = TestUtils;