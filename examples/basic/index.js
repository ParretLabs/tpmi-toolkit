const util = require('util');
const fs = require('fs');
const prompt = require('prompt');

const writeFile = util.promisify(fs.writeFile);

const { Vectorizer, MapUtilities } = require('../../');

(async () => {
	console.log("TPMI Toolkit - Basic");

	prompt.start();
	const {UMmapID} = await prompt.get(['UMmapID']);

	console.log("Retrieving map...");

	let tileMap = await MapUtilities.mapIDToTileMap(UMmapID);
	let wallMap = MapUtilities.tileMapToWallMap(tileMap);

	let vectorMap = Vectorizer.createVectorMapFromTileMap(tileMap);

	await writeFile(__dirname + "/map.html", vectorMap.visualize() + MapUtilities.visualizeWallMap(wallMap));

	console.log("Wrote preview file to " + __dirname + "/map.html");
})();