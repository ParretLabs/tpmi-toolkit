const TestUtils = require('./TestUtils');
const VisualUtilities = require("../modules/utils/VisualUtilities");

const Vectorizer = require("../modules/Vectorizer");

const visualizer = new TestUtils.Visualizer('Vectorizer');

const EXPECTED_DATA = require('./expected/Vectorizer');

jest.setTimeout(20000);

test("Can vectorize map", async () => {
	const { MAP_DATA } = await TestUtils.getTestMaps();

	for(const [name, map] of MAP_DATA) {
		const mapTestOutput = Vectorizer.createVectorMapFromTileMap(map);
		await visualizer.writeVisualFile(name, mapTestOutput.visualize() + `<!--

-->`);

		process.stdout.write('\nTesting ' + name);
		if(EXPECTED_DATA[name]) expect(mapTestOutput).toStrictEqual(EXPECTED_DATA[name]);
	}
});