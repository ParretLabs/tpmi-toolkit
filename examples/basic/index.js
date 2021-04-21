const util = require('util');
const fs = require('fs');
const writeFile = util.promisify(fs.writeFile);

const { Vectorizer, MapUtilities } = require('../../');

(async () => {
	console.log("Getting map");
	let tileMap = await MapUtilities.mapIDToTileMap(68388);
	let wallMap = MapUtilities.tileMapToWallMap(tileMap);

	let vectorMap = Vectorizer.createVectorMapFromTileMap(tileMap);

	// console.log(wallMap);

	console.log("Writing map to file");
	await writeFile("./map.html", vectorMap.visualize() + MapUtilities.visualizeWallMap(wallMap));
})();