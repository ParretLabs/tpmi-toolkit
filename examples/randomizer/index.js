const util = require('util');
const fs = require('fs');
const prompt = require('prompt');

const writeFile = util.promisify(fs.writeFile);

const { Vectorizer, Randomizer, MapUtilities, VisualUtilities, Flatten, SETTINGS } = require('../../');

const promptSchema = {
	properties: {
		mapID: {
			description: 'Unfortunate Maps ID',
			pattern: /^[0-9]+$/,
			message: 'ID can only contain digits',
			default: 5436
		},
		noiseLevel: {
			description: 'Noise Level',
			pattern: /^[0-9]+$/,
			message: 'Noise must be a number',
			default: 1
		},
		seed: {
			description: 'Randomization Seed',
			pattern: /^[0-9]+$/,
			message: 'Seed must be a number'
		},
		symmetry: {
			description: 'Map Symmetry | (R)otational, (N)o symmetry',
			pattern: /^[RN]+$/,
			message: 'Invalid Symmetry',
			default: "R"
		}
	}
};

(async () => {
	console.log("TPMI Toolkit - Randomizer - Wall Randomizer");

	prompt.start();
	const settings = await prompt.get(promptSchema);
	settings.noiseLevel = Number(settings.noiseLevel);
	settings.seed = Number(settings.seed);

	console.log("Retrieving map...");
	let tileMap = await MapUtilities.mapIDToTileMap(settings.mapID);

	if(!tileMap) return console.error("Invalid Map ID");

	let vectorMapOld = Vectorizer.createVectorMapFromTileMap(tileMap);
	let vectorMapNew = vectorMapOld.clone();

	let mapRandomizer = new Randomizer(settings.seed);
	console.log("Seed: ", mapRandomizer.seed);

	// Slice the map, but keep the old dimensions
	if(settings.symmetry !== "N") Vectorizer.sliceMap(vectorMapNew, settings.symmetry, true);

	vectorMapNew.set({
		walls: mapRandomizer.additiveRandomizeWalls(
			vectorMapNew.walls,
			new Flatten.Vector(-settings.noiseLevel, -settings.noiseLevel),
			new Flatten.Vector(settings.noiseLevel, settings.noiseLevel)
		)
	}, true);

	if(settings.symmetry !== "N") vectorMapNew.symmetrize(settings.symmetry);

	let tileMapOld = vectorMapOld.tileMap();
	let tileMapNew = vectorMapNew.tileMap();

	let svgOld = VisualUtilities.visualizeWallMap(tileMapOld);
	let svgNew = VisualUtilities.visualizeWallMap(tileMapNew);

	await writeFile(__dirname + "/map.html", vectorMapOld.visualize() + vectorMapNew.visualize() + svgOld + svgNew);

	console.log("Wrote preview file to " + __dirname + "/map.html");
})();