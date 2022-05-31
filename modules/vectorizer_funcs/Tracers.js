const { Point, Segment, Vector, Box, Ray } = require('@flatten-js/core');
const concaveman = require('concaveman');

const Utilities = require('../utils/Utilities');
const VectorUtilities = require('../utils/VectorUtilities');
const GeometryUtilities = require('../utils/GeometryUtilities');
const MapUtilities = require('../utils/MapUtilities');

const { NEIGHBOR_VECTORS, SYMMETRY, SYMMETRY_FUNCTIONS } = require('../CONSTANTS');

const { Wall } = require('../types/Elements');

module.exports = Vectorizer => {

	Vectorizer

	/**
	 * Creates a new wall map that differentiates walls from islands.
	 * @param  {Array[Array]} wallMap
	 * @return {Array[Wall]}
	 */
	Vectorizer.getOptimizedWallMap = wallMap => {
		const clonedWallMap = wallMap.map(a => Array.from(a));
		const mapCenter = [Math.round(clonedWallMap[0].length / 2), Math.round(clonedWallMap.length / 2)];
		const mapCenterPoint = new Point(...mapCenter);
		const detectorLength = Math.max(...mapCenter);
		const essentialWallMap = MapUtilities.getEssentialWalls(clonedWallMap);

		const { tileMap: optimizedWallMap, detectors: wallMapDetectors } = VectorUtilities.tileMapGenerator({
			detectorSize: 1,
			mapWidth: clonedWallMap[0].length,
			mapHeight: clonedWallMap.length,
			detectorFilter: (point) => {
				return essentialWallMap[point.y][point.x] !== 0;
			},
			detectorMap: (point) => {
				return null;
			},
			callback: (tileMap, point, detector, detectors) => {
				if(essentialWallMap[point.y][point.x] === 0) return;

				const centerAngle = Utilities.angleBetween(mapCenter, [point.x, point.y]);
				const detectorRay = new Segment(mapCenterPoint, new Point(
					Math.round(mapCenterPoint.x + (Math.cos(centerAngle) * detectorLength)),
					Math.round(mapCenterPoint.y + (Math.sin(centerAngle) * detectorLength))
				));
				const intersections = detectors.map(d => {
					const ints = detectorRay.intersect(d);
					return ints.length > 0 ? d.centerPoint : false;
				}).filter(d => d).sort((a, b) => b.distanceTo(mapCenterPoint)[0] - a.distanceTo(mapCenterPoint)[0]);

				if(intersections[0] && intersections[0].equalTo(point)) {
					tileMap[point.y][point.x] = 1;
				} else {
					tileMap[point.y][point.x] = 2;
				}
			},
		});

		let spreadWallTypes = (point) => {
			if(optimizedWallMap[point.y][point.x] === 0) return;

			const neighbors = MapUtilities.getNeighbors(optimizedWallMap, point);
			const isCloseToOuterWall = neighbors.some(neighbor => neighbor === 1);
			if(isCloseToOuterWall) {
				optimizedWallMap[point.y][point.x] = 1;
			} else {
				optimizedWallMap[point.y][point.x] = 2;
			}
		};

		// 2 passes, arbitrary
		for (let i = 0; i < 2; i++) {
			for (let x = 0; x < optimizedWallMap[0].length; x++) {
				for (let y = 0; y < optimizedWallMap.length; y++) {
					spreadWallTypes(new Point(x, y));
				}
			}

			for (let y = 0; y < optimizedWallMap.length; y++) {
				for (let x = 0; x < optimizedWallMap[0].length; x++) {
					spreadWallTypes(new Point(x, y));
				}
			}
		}

		let handledIslandPoints = {};
		let outerWallPoints = new Map();
		let islands = [];

		for (let x = 0; x < optimizedWallMap[0].length; x++) {
			for (let y = 0; y < optimizedWallMap.length; y++) {
				const point = new Point(x, y);
				if(optimizedWallMap[point.y][point.x] === 1) {
					const pointHash = `${point.x},${point.y}`;
					if(!outerWallPoints.has(pointHash)) {
						outerWallPoints.set(`${point.x},${point.y}`, point);
					}
				} else {
					const pointHash = `${point.x},${point.y}`;
					if(handledIslandPoints[pointHash]) continue;

					islands.push([]);

					floodFillHelper(point.x, point.y, islands.length - 1);
					handledIslandPoints[pointHash] = true;
				}
			}
		}

		function floodFillHelper(pos_x, pos_y, islandIndex) {
			if(MapUtilities.getTile(optimizedWallMap, pos_x, pos_y) === null) return;
			const pointHash = `${pos_x},${pos_y}`;

			if(handledIslandPoints[pointHash]) return;
			if(optimizedWallMap[pos_y][pos_x] === 2) {
				islands[islandIndex].push(new Point(pos_x, pos_y));

				handledIslandPoints[pointHash] = true;
				
				for (let i = 0; i < NEIGHBOR_VECTORS.length; i++) {
					floodFillHelper(pos_x + NEIGHBOR_VECTORS[i].x, pos_y + NEIGHBOR_VECTORS[i].y, islandIndex);
				}
			}
			
			return;
		}

		outerWallPoints = concaveman(Array.from(outerWallPoints.values()).map(p => [p.x, p.y])).map(p => new Point(p));

		return {optimizedWallMap, outerWallPoints, islands};
	};
};