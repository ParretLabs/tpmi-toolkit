const util = require('util');
const fs = require('fs');
const prompt = require('prompt');

const writeFile = util.promisify(fs.writeFile);

const { Vectorizer, Analyzer, MapUtilities, VisualUtilities, SETTINGS } = require('../../');
const { Timer } = require('../ExampleUtilities');

const promptSchema = {
	properties: {
		mapID: {
			description: 'Unfortunate Maps ID',
			pattern: /^[0-9]+$/,
			message: 'ID can only contain digits',
			default: 5436
		},
		laserAmount: {
			description: 'Amount of lasers to cast',
			pattern: /^[0-9]+$/,
			message: 'Must be a number',
			default: 8
		},
		maxLanes: {
			description: 'Amount of lanes to show',
			pattern: /^[0-9]+$/,
			message: 'Must be a number',
			default: 4
		}
	}
};

(async () => {
	let timer = new Timer();
	console.log("TPMI Toolkit - Analyzer - Lane Finder");

	prompt.start();
	const settings = await prompt.get(promptSchema);
	settings.laserAmount = Number(settings.laserAmount);
	settings.maxLanes = Number(settings.maxLanes);

	console.log("Retrieving map...");
	timer.start();
	let tileMap = await MapUtilities.mapIDToTileMap(settings.mapID);
	if(!tileMap) return console.error("Invalid Map ID");

	console.log("Retrieved map in ", timer.stop() + "ms");

	let vectorMap = Vectorizer.createVectorMapFromTileMap(tileMap);

	console.log("Drawing rays...");
	timer.start();

	let { lanes } = Analyzer.laneFinder(vectorMap, settings);
	let lanesSVG = VisualUtilities.groupSVGElements(lanes.map(l => l.visualize()));

	console.log("Finished drawing rays in ", timer.stop() + "ms");

	await writeFile(__dirname + "/map.html", VisualUtilities.appendToSVGDoc(vectorMap.visualize(), lanesSVG));

	console.log("Wrote preview file to " + __dirname + "/map.html");
})();