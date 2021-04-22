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
		},
		symmetry: {
			description: 'Map Symmetry | (R)otational, "" for no symmetry',
			pattern: /^[R ]+$/,
			message: 'Invalid Symmetry',
			default: ""
		}
	}
};

(async () => {
	console.log("TPMI Toolkit - Randomizer - Wall Randomizer");

	prompt.start();
	const settings = await prompt.get(promptSchema);

	console.log("Retrieving map...");
	let tileMap = await MapUtilities.mapIDToTileMap(settings.mapID);

	let vectorMapOld = Vectorizer.createVectorMapFromTileMap(tileMap);
	let vectorMapNew = vectorMapOld.clone();

	let mapRandomizer = new Randomizer(settings.seed);

	vectorMapNew.setWalls(mapRandomizer.additiveRandomizeWalls(
		vectorMapNew.walls,
		new Flatten.Vector(-settings.noiseLevel, -settings.noiseLevel),
		new Flatten.Vector(settings.noiseLevel, settings.noiseLevel)
	));

	if(settings.symmetry) vectorMapNew.symmetrize(settings.symmetry);

	await writeFile(__dirname + "/map.html", vectorMapOld.visualize() + vectorMapNew.visualize());

	console.log("Wrote preview file to " + __dirname + "/map.html");
})();