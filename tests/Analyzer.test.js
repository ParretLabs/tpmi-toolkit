const TestUtils = require('./TestUtils');

const Vectorizer = require("../modules/Vectorizer");
const Analyzer = require("../modules/Analyzer");

const EXPECTED_DATA = require('./expected/Analyzer');

jest.setTimeout(20000);

test("ANALYZER: Can detect map symmetry", async () => {
	const { MAP_DATA } = await TestUtils.getTestMaps();

	for(const [name, map] of MAP_DATA) {
		const vectorMap = Vectorizer.createVectorMapFromTileMap(map);
		const symmetry = Analyzer.detectVectorMapSymmetry.closest(vectorMap);

		process.stdout.write('\nAnalyzing ' + name);
		if(EXPECTED_DATA[name]) expect(symmetry).toStrictEqual(EXPECTED_DATA[name]);
	}
});