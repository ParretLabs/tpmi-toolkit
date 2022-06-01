const { Point, Segment, Vector, Box, Line, Polygon } = require('@flatten-js/core');

const Utilities = require('./utils/Utilities');
const VectorUtilities = require('./utils/VectorUtilities');
const MapUtilities = require('./utils/MapUtilities');
const GeometryUtilities = require('./utils/GeometryUtilities');
const VisualUtilities = require('./utils/VisualUtilities');

const { NEIGHBOR_VECTORS, SYMMETRY, SYMMETRY_FUNCTIONS, TILE_IDS, ELEMENT_TYPES } = require('./CONSTANTS');

const Vectorizer = {};

Vectorizer.VectorMap = class VectorMap {
	constructor({
		elements={}
	}) {
		this.size = new Vector(0, 0);

		this.elements = {
			outerWall: elements.outerWall || null,
			islands: elements.islands || [],
			flags: elements.flags || [],
			spikes: elements.spikes || [],
			bombs: elements.bombs || [],
		};

		this.planarSets = null;
		this.pathFindingMap = null;

		this.normalize();

		if(this.size.length === 0) throw new Error("Empty maps are not supported. Vector maps must contain elements to be initialized.");
	}

	get width() {return this.size.x;}
	get height() {return this.size.y;}

	clone() {
		return new Vectorizer.VectorMap({
			elements: {
				outerWall: this.elements.outerWall.clone(),
				islands: this.elements.islands.map(i => i.clone()),
				flags: this.elements.flags.map(f => f.clone()),
				spikes: this.elements.spikes.map(s => s.clone()),
				bombs: this.elements.bombs.map(b => b.clone())
			}
		});
	}

	set(elementsObj, disableNormalization) {
		Object.assign(this, elementsObj);

		if(!disableNormalization) this.normalize();
	}

	getElements() {
		return ELEMENT_TYPES.reduce(
			(acc, e) => acc.concat(this.elements[e.toLowerCase()]),
			[]
		).concat([this.elements.outerWall]);
	}

	setElements(elementsObj, disableNormalization) {
		this.elements = {
			...this.elements,
			...elementsObj
		};

		if(!disableNormalization) this.normalize();
	}

	// Recalculates map properties
	normalize() {
		const allElements = this.getElements();
		if(allElements.length === 0) return;

		VectorUtilities.roundElementPositions(allElements);

		// Reframe the map so that the element closest to the top left corner becomes the origin for the entire map.
		let translationVector = VectorUtilities.getMinVectorFromElements(allElements).multiply(-1);
		VectorUtilities.translateElements(allElements, translationVector);

		this.size = VectorUtilities.getMaxVectorFromElements(allElements);

		this.planarSets = VectorUtilities.generatePlanarSetsFromVectorMap(this);
		this.pathFindingMap = Vectorizer.generatePathFindingMap(this).tileMap;
	}

	symmetrize(symmetry, settings={}) {
		Vectorizer.sliceMap(this, symmetry);
		Vectorizer.symmetrizeMap(this, symmetry);

		if(settings.fillWallHoles) this.setElements({
			walls: Vectorizer.fillWallHoles(this.walls)
		}, true);

		this.normalize();

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
	const { flags, bombs, spikes } = VectorUtilities.getVectorPointElementsFromTileMap(tileMap);
	const { outerWall, islands } = Vectorizer.getWallsFromWallMap(wallMap);

	let vectorMap = new Vectorizer.VectorMap({
		elements: {
			outerWall: outerWall,
			islands: islands,
			flags, bombs, spikes
		}
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
			for (let i = vectorMap.elements.walls.length - 1; i >= 0; i--) {
				if(
					vectorMap.elements.walls[i].shape.intersect(detector).length ||
					vectorMap.elements.walls[i].shape.start.equalTo(point)
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
				return 1;
			} else if(vectorMap.planarSets.semipassible.search(detector)) {
				return 2;
			}
		}
	});

	return {tileMap, detectors};
};

// Slices a vector map in half
Vectorizer.sliceMap = (vectorMap, symmetry) => {
	let sliceLine = VectorUtilities.getSliceLineFromSymmetry(vectorMap, symmetry);

	// Slice all the different types of elements.
	let sliceableElements = ["walls", "flags", "bombs", "spikes"];
	let newElements = {};

	for (let i = sliceableElements.length - 1; i >= 0; i--) {
		newElements[sliceableElements[i]] = VectorUtilities.sliceVectorElements(vectorMap.elements[sliceableElements[i]], sliceLine);
	}

	vectorMap.setElements(newElements, true);

	return vectorMap;
};

// Makes a map symmetrical
Vectorizer.symmetrizeMap = (vectorMap, symmetry) => {
	let mirrorFunc = p => p;

	if(SYMMETRY_FUNCTIONS[symmetry]) mirrorFunc = p => SYMMETRY_FUNCTIONS[symmetry](vectorMap, p);

	// Mirror all the different types of elements.
	let mirrorableElements = ["walls", "flags", "bombs", "spikes"];
	let newElements = {};

	for (let i = mirrorableElements.length - 1; i >= 0; i--) {
		newElements[mirrorableElements[i]] = VectorUtilities.mirrorVectorElements(
			vectorMap.elements[mirrorableElements[i]], mirrorFunc, { duplicate: true }
		);
	}

	vectorMap.setElements(newElements, true);

	return vectorMap;
};

module.exports = Vectorizer;