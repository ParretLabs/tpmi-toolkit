const { Point, Segment, Vector, Box, Line } = require('@flatten-js/core');

const Utilities = require('./utils/Utilities');
const VectorUtilities = require('./utils/VectorUtilities');
const MapUtilities = require('./utils/MapUtilities');
const GeometryUtilities = require('./utils/GeometryUtilities');
const VisualUtilities = require('./utils/VisualUtilities');

const { NEIGHBOR_VECTORS, SYMMETRY, SYMMETRY_FUNCTIONS, TILE_IDS, ELEMENT_TYPES } = require('./CONSTANTS');

const Vectorizer = {};

Vectorizer.VectorMap = class VectorMap {
	constructor({
		walls,
		flags,
		spikes,
		bombs
	}) {
		this.size = null;
		this.walls = walls || [];
		this.flags = flags || [];
		this.spikes = spikes || [];
		this.bombs = bombs || [];

		this.planarSets = null;
		this.pathFindingMap = null;

		this.normalize();
	}

	get width() {return this.size.x;}
	get height() {return this.size.y;}
	get elements() {return [].concat(this.walls, this.flags, this.spikes, this.bombs)}

	clone() {
		return new Vectorizer.VectorMap({
			walls: this.walls.map(w => w.clone()),
			flags: this.flags.map(f => f.clone()),
			spikes: this.spikes.map(s => s.clone()),
			bombs: this.bombs.map(b => b.clone())
		});
	}

	set(elementsObj, disableNormalization) {
		Object.assign(this, elementsObj);

		if(!disableNormalization) this.normalize();
	}

	// Recalculates map properties
	normalize() {
		VectorUtilities.roundMapPositions(this);
		ELEMENT_TYPES.map(e => e.toLowerCase()).forEach(elem => {
			this[elem] = Vectorizer.reframeElements(this[elem]);
		});

		this.size = VectorUtilities.getMaxVectorFromElements(this.elements);
		this.planarSets = VectorUtilities.generatePlanarSetsFromVectorMap(this);
		this.pathFindingMap = Vectorizer.generatePathFindingMap(this).tileMap;
	}

	symmetrize(symmetry) {
		// Normalization is disabled so the dimensions stay the same.
		// This is required so that the mirroring is accurate.
		Vectorizer.sliceMap(this, symmetry, true);
		Vectorizer.symmetrizeMap(this, symmetry);

		this.set({
			walls: Vectorizer.fillWallHoles(this.walls)
		});

		return this;
	}

	tileMap() {
		return Vectorizer.createTileMapFromVectorMap(this).tileMap;
	}

	visualize() {
		return VisualUtilities.visualizeVectorMap(this);
	}
};

require('./vectorizer_funcs/fillWallHoles')(Vectorizer);
require('./vectorizer_funcs/Tracers')(Vectorizer);

Vectorizer.createVectorMapFromTileMap = tileMap => {
	const wallMap = MapUtilities.tileMapToWallMap(tileMap);
	const { flags, bombs, spikes } = VectorUtilities.getVectorElementsFromTileMap(tileMap);

	let vectorMap = new Vectorizer.VectorMap({
		walls: Vectorizer.getLinesFromWallMap(wallMap),
		flags, bombs, spikes
	});

	return vectorMap;
};

Vectorizer.createTileMapFromVectorMap = vectorMap => {
	// Can be optimized using a planar set.
	let {tileMap, detectors} = VectorUtilities.tileMapGenerator({
		detectorSize: 0.9,
		mapWidth: vectorMap.width + 1,
		mapHeight: vectorMap.height + 1,
		callback: (tileMap, point, detector) => {
			for (let i = vectorMap.walls.length - 1; i >= 0; i--) {
				if(
					vectorMap.walls[i].intersect(detector).length ||
					vectorMap.walls[i].start.equalTo(point)
				) {
					tileMap[point.y][point.x] = TILE_IDS.WALL;
					break;
				}
			}
		}
	});

	return {tileMap, detectors};
};

Vectorizer.generatePathFindingMap = vectorMap => {
	let {tileMap, detectors} = VectorUtilities.tileMapGenerator({
		detectorSize: 0.9,
		mapWidth: vectorMap.width,
		mapHeight: vectorMap.height,
		callback: (tileMap, point, detector) => {
			if(vectorMap.planarSets.immpassible.search(detector)) {
				tileMap[point.y][point.x] = 1;
			} else if(vectorMap.planarSets.semipassible.search(detector)) {
				tileMap[point.y][point.x] = 2;
			}
		}
	});

	return {tileMap, detectors};
};

VectorUtilities.generatePlanarSetsFromVectorMap = vectorMap => {
	let planarSets = {};

	// Puts all impassible-type element shapes into a planar set
	planarSets.immpassible = VectorUtilities.generatePlanarSetFromElementArrays(
		vectorMap.walls,
		vectorMap.spikes
	);

	// Puts all semipassible-type element shapes into a planar set
	planarSets.semipassible = VectorUtilities.generatePlanarSetFromElementArrays(
		vectorMap.flags,
		vectorMap.bombs
	);

	// Puts all element shapes into a planar set
	planarSets.all = VectorUtilities.generatePlanarSetFromElementArrays(
		vectorMap.walls,
		vectorMap.spikes,
		vectorMap.flags,
		vectorMap.bombs
	);

	return planarSets;
};

// Slices a vector map in half
Vectorizer.sliceMap = (vectorMap, symmetry, disableNormalization) => {
	let sliceLine = VectorUtilities.getSliceLineFromSymmetry(vectorMap, symmetry);

	// Slice all the different types of elements.
	let sliceableElements = ["walls", "flags", "bombs", "spikes"];
	let newElements = {};

	for (let i = sliceableElements.length - 1; i >= 0; i--) {
		newElements[sliceableElements[i]] = VectorUtilities.sliceVectorElements(vectorMap[sliceableElements[i]], sliceLine);
	}

	vectorMap.set(newElements, disableNormalization);

	return vectorMap;
};

// Makes a map symmetrical
Vectorizer.symmetrizeMap = (vectorMap, symmetry) => {
	let mirrorFunc = p => p;

	if(SYMMETRY_FUNCTIONS[symmetry]) mirrorFunc = p => SYMMETRY_FUNCTIONS[symmetry](vectorMap, p);

	let newMapWalls = VectorUtilities.mirrorVectorElements(vectorMap.walls, mirrorFunc, { duplicate: true });
	// Set the walls and recalculate the map size so that the remaining elements are correctly mirrored.
	vectorMap.set({ walls: newMapWalls });

	// Mirror all the different types of elements.
	let mirrorableElements = ["flags", "bombs", "spikes"];
	let newElements = {};

	for (let i = mirrorableElements.length - 1; i >= 0; i--) {
		newElements[mirrorableElements[i]] = VectorUtilities.mirrorVectorElements(
			vectorMap[mirrorableElements[i]], mirrorFunc, { duplicate: true }
		);
	}

	vectorMap.set(newElements);

	return newMapWalls;
};

// Pushes elements with negative positions into positive positions.
Vectorizer.reframeElements = elements => {
	let translationVector = VectorUtilities.getMinVectorFromElements(elements);
	translationVector = translationVector.multiply(-1);
	for (let i = elements.length - 1; i >= 0; i--) {
		const element = elements[i];

		if(element.constructor.name === "Segment" || element.constructor.name === "Point") {
			elements[i] = element.translate(translationVector);
		} else if(element.point) {
			elements[i].point = element.point.translate(translationVector)
		}
	}

	return elements;
};

module.exports = Vectorizer;