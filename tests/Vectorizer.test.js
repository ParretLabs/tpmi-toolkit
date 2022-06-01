const TestUtils = require('./TestUtils');
const VisualUtilities = require("../modules/utils/VisualUtilities");

const Vectorizer = require("../modules/Vectorizer");

const visualizer = new TestUtils.Visualizer('Vectorizer');

const EXPECTED_DATA = require('./expected/Vectorizer');

jest.setTimeout(20000);

let vectorMaps = new Map();

test("VECTORIZE: Can vectorize map", async () => {
	const { MAP_DATA } = await TestUtils.getTestMaps();

	for(const [name, map] of MAP_DATA) {
		const mapTestOutput = Vectorizer.createVectorMapFromTileMap(map);
		vectorMaps.set(name, mapTestOutput);
		await visualizer.writeVisualFile(name, mapTestOutput.visualize() + `<!--

-->`);

		process.stdout.write('\nTesting ' + name);
		if(EXPECTED_DATA[name]) expect(mapTestOutput).toStrictEqual(EXPECTED_DATA[name]);
	}
});

let slicedMaps = new Map();

test("VECTORIZE: Can slice map", async () => {
	for(const [name, map] of vectorMaps) {
		const sliced = Vectorizer.sliceMap(map, "H");
		slicedMaps.set(name, sliced);

		await visualizer.writeVisualFile("sliced_" + name, sliced.visualize());

		process.stdout.write('\nSlicing ' + name);
	}
});

test("VECTORIZE: Can mirror map", async () => {
	for(const [name, map] of slicedMaps) {
		const mirrored = map.symmetrize("H");
		// mirroredMaps.set(name, mirrored);
		
		await visualizer.writeVisualFile("mirrored_" + name, mirrored.visualize());

		process.stdout.write('\nMirroring ' + name);
	}
});