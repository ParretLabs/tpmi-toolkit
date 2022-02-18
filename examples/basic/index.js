const util = require('util');
const fs = require('fs');
const prompt = require('prompt');

const writeFile = util.promisify(fs.writeFile);

const { Vectorizer, MapUtilities, VisualUtilities } = require('../../');

(async () => {
	console.log("TPMI Toolkit - Basic");

	prompt.start();
	const { mapID } = await prompt.get({
		properties: {
			mapID: {
				description: 'Unfortunate Maps ID',
				pattern: /^[0-9]+$/,
				message: 'ID can only contain digits',
				default: String(Math.floor(Math.random() * 80000))
			}
		}
	});

	console.log("Retrieving map...");

	let tileMap = await MapUtilities.mapIDToTileMap(mapID);
	let wallMap = MapUtilities.tileMapToWallMap(tileMap);

	let vectorMap = Vectorizer.createVectorMapFromTileMap(tileMap);
	
	await writeFile(__dirname + "/map.html", vectorMap.visualize() + VisualUtilities.visualizeWallMap(wallMap));

	console.log("Wrote preview file to " + __dirname + "/map.html");
})();