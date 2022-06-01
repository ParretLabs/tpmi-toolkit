const TestUtils = require('./TestUtils');
const VisualUtilities = require("../modules/utils/VisualUtilities");

const Tracers = require("../modules/vectorizer_funcs/Tracers");

const Vectorizer = {};
Tracers(Vectorizer);

const visualizer = new TestUtils.Visualizer('Tracers');

const EXPECTED_DATA = require('./expected/Tracers');

jest.setTimeout(20000);

test("getOptimizedWallMap returns correct map", async () => {
	const { IMPASSABLE_MAP_DATA } = await TestUtils.getTestMaps();

	for(const [name, impassableMap] of IMPASSABLE_MAP_DATA) {
		const mapTestOutput = Vectorizer.getOptimizedWallMap(impassableMap);
		process.stdout.write('\nTesting ' + name);
		if(EXPECTED_DATA[name]) expect(mapTestOutput.optimizedWallMap).toStrictEqual(EXPECTED_DATA[name].optimizedWallMap);
	}
});

test("getWallVectors returns correct map", async () => {
	const { IMPASSABLE_MAP_DATA } = await TestUtils.getTestMaps();

	for(const [name, impassableMap] of IMPASSABLE_MAP_DATA) {
		const mapTestOutput = Vectorizer.getWallVectors(impassableMap);
		await visualizer.writeVisualFile(name, VisualUtilities.visualizeWallVectors(mapTestOutput) + `<!--
${JSON.stringify(mapTestOutput)}
-->`);

		process.stdout.write('\nTesting ' + name);
		if(EXPECTED_DATA[name]) expect(mapTestOutput.optimizedWallMap).toStrictEqual(EXPECTED_DATA[name].optimizedWallMap);
	}
});