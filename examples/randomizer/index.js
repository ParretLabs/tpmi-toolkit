const util = require('util');
const fs = require('fs');
const prompt = require('prompt');

const writeFile = util.promisify(fs.writeFile);

const { Vectorizer, Randomizer, MapUtilities, Flatten } = require('../../');

(async () => {
	console.log("Input a valid U-M map ID");

	prompt.start();
	const {mapID} = await prompt.get(['mapID']);

	console.log("Retrieving map...");
	let tileMap = await MapUtilities.mapIDToTileMap(mapID);

	let vectorMapOld = Vectorizer.createVectorMapFromTileMap(tileMap);
	let vectorMapNew = Vectorizer.createVectorMapFromTileMap(tileMap);

	let mapRandomizer = new Randomizer();

	vectorMapNew.walls = mapRandomizer.additiveRandomizeWalls(
		vectorMapNew.walls,
		new Flatten.Vector(-2, -2),
		new Flatten.Vector(2, 2)
	);

	await writeFile(__dirname + "/map.html", vectorMapOld.visualize() + vectorMapNew.visualize());

	console.log("Wrote preview file to " + __dirname + "/map.html");
})();