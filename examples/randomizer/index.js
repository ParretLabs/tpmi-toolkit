const util = require('util');
const fs = require('fs');
const prompt = require('prompt');

const writeFile = util.promisify(fs.writeFile);

const { Vectorizer, Randomizer, MapUtilities, Flatten, SETTINGS } = require('../../');

const promptSchema = {
	properties: {
		mapID: {
			description: 'Unfortunate Maps ID',
			type: 'number',
			pattern: /^[0-9]+$/,
			message: 'ID can only contain digits',
			default: 5436
		},
		noiseLevel: {
			description: 'Noise Level',
			type: 'number',
			pattern: /^[0-9]+$/,
			message: 'Noise must be a number',
			default: 1
		},
		seed: {
			description: 'Randomization Seed',
			type: 'number',
			pattern: /^[0-9]+$/,
			message: 'Seed must be a number'
		}
	}
};

(async () => {
	console.log("TPMI Toolkit - Randomizer - Wall Randomizer");

	prompt.start();
	const settings = await prompt.get(promptSchema);
	settings.noiseLevel = Number(settings.noiseLevel);

	console.log("Retrieving map...");
	let tileMap = await MapUtilities.mapIDToTileMap(settings.mapID);

	let vectorMapOld = Vectorizer.createVectorMapFromTileMap(tileMap);
	let vectorMapNew = Vectorizer.createVectorMapFromTileMap(tileMap);

	let mapRandomizer = new Randomizer(settings.seed);

	// vectorMapNew.setWalls(mapRandomizer.additiveRandomizeWalls(
	// 	vectorMapNew.walls,
	// 	new Flatten.Vector(-settings.noiseLevel, -settings.noiseLevel),
	// 	new Flatten.Vector(settings.noiseLevel, settings.noiseLevel)
	// ));

	Vectorizer.sliceMap(vectorMapNew, SETTINGS.SYMMETRY.ROTATIONAL)

	await writeFile(__dirname + "/map.html", vectorMapOld.visualize() + vectorMapNew.visualize());

	console.log("Wrote preview file to " + __dirname + "/map.html");
})();