const { Point, Segment, Vector, Box, Polygon } = require('@flatten-js/core');
const concaveman = require('concaveman');

const Utilities = require('../utils/Utilities');
const VectorUtilities = require('../utils/VectorUtilities');
const GeometryUtilities = require('../utils/GeometryUtilities');
const MapUtilities = require('../utils/MapUtilities');

const { NEIGHBOR_VECTORS, SYMMETRY, SYMMETRY_FUNCTIONS } = require('../CONSTANTS');

const { Wall } = require('../types/Elements');

module.exports = Vectorizer => {
	/**
	 * An array of points that represent a cluster of map elements.
	 * @typedef {Array[Point]} Cluster
	 */

	/**
	 * @typedef {Object} OptimizedWallMap
	 * @property {Array[Array]} optimizedWallMap - 2D Array where 0 = Floor, 1 = Outer Wall, 2 = Island
	 * @property {Array[Point]} outerWall        - Array of points where the outer wall lies
	 */
	
	/**
	 * @typedef {Object} WallVectors
	 * @property {Array[Array]} optimizedWallMap - 2D Array where 0 = Floor, 1 = Outer Wall, 2 = Island
	 * @property {Array[Point]} outerWall        - Array of points where the outer wall lies
	 * @property {Array[Cluster]} islands        - Array of island clusters
	 */

	Vectorizer.getWallVectors = impassableMap => {
		// Trace outer wall and get optimized wall map
		const { optimizedWallMap, outerWall } = Vectorizer.getOptimizedWallMap(impassableMap);

		// Trace islands
		const islands = Vectorizer.traceSparseElementsFromMap(optimizedWallMap, impassableMap, 2);

		return { optimizedWallMap, outerWall, islands };
	};

	/**
	 * Creates a new wall map that differentiates walls from islands.
	 * @param  {Array[Array]} impassableMap
	 * @return {OptimizedWallMap}
	 */
	Vectorizer.getOptimizedWallMap = impassableMap => {
		// Clone map
		impassableMap = impassableMap.map(a => Array.from(a));

		const optimizedWallMap = impassableMap.map(a => Array(a.length).fill(0));
		const essentialWallMap = MapUtilities.getEssentialWalls(impassableMap);

		// Create point array of all essential walls in the map
		const allWallPoints = [];
		for (let y = 0; y < essentialWallMap.length; y++) {
			for (let x = 0; x < essentialWallMap[0].length; x++) {
				if(essentialWallMap[y][x] > 0) {
					allWallPoints.push([x, y]);
				}
			}
		}

		// Create a concave hull, polygon, and point hashmap from the point array 
		const outerWallPoints = concaveman(allWallPoints, 1).map(p => new Point(p));
		const outerWallPolygon = new Polygon(outerWallPoints);
		const outerWallPointMap = outerWallPoints.reduce((acc, val) => {
			acc[`${val.x},${val.y}`] = true;
			return acc;
		}, {});

		// Mark islands and walls into optimizedWallMap
		for (let y = 0; y < optimizedWallMap.length; y++) {
			for (let x = 0; x < optimizedWallMap[0].length; x++) {
				if(impassableMap[y][x] > 0 && outerWallPolygon.contains(new Point(x, y))) {
					const pointHash = `${x},${y}`;
					optimizedWallMap[y][x] = outerWallPointMap[pointHash] ? 1 : 2;
				}
			}
		}

		return {
			optimizedWallMap,
			outerWall: outerWallPoints
		};
	};

	/**
	 * Creates an array of polygons that represent clusters of elements.
	 * @param  {Array[Array]} markMap
	 * @param  {Array[Array]} elementMap
	 * @param  {number} tileID
	 * @return {Array[Cluster]}
	 */
	Vectorizer.traceSparseElementsFromMap = (markMap, elementMap, tileID) => {
		let handledClusterPoints = {};
		let clusters = [];

		// Create cluster polygons using floodfill algorithm
		for (let y = 0; y < markMap.length; y++) {
			for (let x = 0; x < markMap[0].length; x++) {
				if(markMap[y][x] === tileID) {
					const pointHash = `${x},${y}`;
					if(handledClusterPoints[pointHash]) continue;

					clusters.push([]);

					floodFillHelper(x, y, clusters.length - 1);
					handledClusterPoints[pointHash] = true;
				}
			}
		}

		// Clean up clusters using a concave hull
		for (let i = clusters.length - 1; i >= 0; i--) {
			if(clusters[i].length < 2) {
				clusters.splice(i, 1);
				continue;
			}

			clusters[i] = concaveman(clusters[i].map(p => [p.x, p.y]), 1).map(p => new Point(p));
		}

		function floodFillHelper(pos_x, pos_y, islandIndex) {
			if(MapUtilities.getTile(markMap, pos_x, pos_y) === null) return;
			const pointHash = `${pos_x},${pos_y}`;

			if(handledClusterPoints[pointHash]) return;
			if(markMap[pos_y][pos_x] === 2) {
				const detectorPolygon = GeometryUtilities.tileIDToPolygon(elementMap[pos_y][pos_x], new Point(pos_x, pos_y));
				clusters[islandIndex] = clusters[islandIndex].concat(detectorPolygon.vertices);

				handledClusterPoints[pointHash] = true;
				
				for (let i = 0; i < NEIGHBOR_VECTORS.length; i++) {
					floodFillHelper(pos_x + NEIGHBOR_VECTORS[i].x, pos_y + NEIGHBOR_VECTORS[i].y, islandIndex);
				}
			}
			
			return;
		}

		return clusters;
	};
};