const TestUtils = require('./TestUtils');
const VisualUtilities = require("../modules/utils/VisualUtilities");

const MapUtilities = require("../modules/utils/MapUtilities");

const visualizer = new TestUtils.Visualizer('MapUtilities');

const EXPECTED_DATA = require('./expected/MapUtilities');

jest.setTimeout(20000);

test("tilemaps", async () => {
	const { MAP_DATA } = await TestUtils.getTestMaps();

	for(const [name, map] of MAP_DATA) {
		await visualizer.writeVisualFile(name + "_tiles", VisualUtilities.visualizeWallMap(map) + `<!--

-->`);

		process.stdout.write('\nTesting ' + name);
		if(EXPECTED_DATA[name]) expect(map).toStrictEqual(map);
	}
});

test("getEssentialWalls works", async () => {
	const { IMPASSABLE_MAP_DATA } = await TestUtils.getTestMaps();

	for(const [name, impassableMap] of IMPASSABLE_MAP_DATA) {
		const mapTestOutput = MapUtilities.getEssentialWalls(impassableMap);
		await visualizer.writeVisualFile(name, VisualUtilities.visualizeWallMap(mapTestOutput) + `<!--
${JSON.stringify(mapTestOutput)}
-->`);

		process.stdout.write('\nTesting ' + name);
		if(EXPECTED_DATA[name]) expect(mapTestOutput).toStrictEqual(EXPECTED_DATA[name]);
	}
});