// This module generates specific types of analysis' on maps.

const { Segment, Box } = require('@flatten-js/core');

const Utilities = require('./utils/Utilities');
const VectorUtilities = require('./utils/VectorUtilities');
const GeometryUtilities = require('./utils/GeometryUtilities');

const { SYMMETRY, ELEMENT_TYPES } = require('./CONSTANTS');

let Analyzer = {};

Analyzer.laneFinder = (vectorMap, inputSettings={}) => {
	const MAP_DIAG = vectorMap.width ^ 2 + vectorMap.height ^ 2;
	const BASE_RADIUS = MAP_DIAG / 8;

	let settings = {
		laserAmount: 8,
		maxLanes: 4,
		maxPathLength: MAP_DIAG * 1.5,
		stepLength: 0.01,
		detectorSize: 0.5,
		maxBounces: 8,
		...inputSettings
	};

	let [startFlag, endFlag] = VectorUtilities.getFlagPair(vectorMap.flags);
	let lasers = [];

	console.log(BASE_RADIUS);

	for (let angle = 0; angle <= (Math.PI * 2); angle += (Math.PI * 2) / settings.laserAmount) {
		let laser = new GeometryUtilities.Laser(startFlag.point.x, startFlag.point.y, angle);
		laser.bounces = 0;

		lasers.push(laser);
	}

	for (let i = settings.maxPathLength * (1 / settings.stepLength); i >= 0; i--) {
		for (let i = lasers.length - 1; i >= 0; i--) {
			if(lasers[i].clear) continue;

			let laserHeadDetector = GeometryUtilities.createDetector(lasers[i].head.end, {size: settings.detectorSize});
			let intersectedShape = vectorMap.planarSets.immpassable.search(laserHeadDetector)[0];

			// If the laser is touching a segment, reflect its angle.
			if(intersectedShape) {
				lasers[i].bounces++;

				// If the intersected shape is a point or the laser has hit max bounces, kill the laser.
				if(
					typeof intersectedShape.slope === "undefined" ||
					lasers[i].bounces >= settings.maxBounces
				) {
					// lasers.splice(i, 1);
					continue;
				}

				let shapeAngle = intersectedShape.slope + Math.PI * 0.5;
				let newAngle = (GeometryUtilities.normalizeAngleNegative(lasers[i].angle) * -1);

				lasers[i].step(-settings.stepLength);
				lasers[i].changeDirection(newAngle);

				// if(shapeAngle + lasers[i].angle > Math.PI * 2) console.log(intersectedShape.slope, shapeAngle + lasers[i].angle);
			}

			// If the laser is in the base and has a clear line of sight to the flag
			if(
				lasers[i].head.end.distanceTo(endFlag.point)[0] <= BASE_RADIUS &&
				GeometryUtilities.clearLineOfSight(lasers[i].head.end, endFlag.point, vectorMap.planarSets.immpassable)
			) {
				// Mark it as a clear route
				lasers[i].clear = true;

				console.log(lasers[i].head.end, endFlag.point);
			}

			lasers[i].step(settings.stepLength);
		}
	}

	// Only keep the clear paths.
	lasers = lasers.filter(a => a.clear);

	return {
		lanes: lasers
	};
};

Analyzer.detectVectorMapSymmetry = {
	closest: vectorMap => {
		const symmetryIDs = Object.values(SYMMETRY);
		let symmetryScore = symmetryIDs.reduce((acc, val) => ({
			...acc,
			[val]: 0
		}), {});
		const elementTypes = ELEMENT_TYPES.map(e => e.toLowerCase());

		for(let i = 0; i < elementTypes.length; i++) {
			const elementType = elementTypes[i];

			if(vectorMap[elementType].length >= 2) {
				symmetry = VectorUtilities.getClosestSymmetricRelationshipBetweenElements(
					vectorMap, vectorMap[elementType]
				);
				symmetryScore[symmetry]++;
			}
		}

		return symmetryIDs.reduce(
			(highestScore, sym) => symmetryScore[sym] > highestScore[0] ? [symmetryScore[sym], sym] : highestScore
		, [0, "A"])[1];
	}
};

module.exports = Analyzer;