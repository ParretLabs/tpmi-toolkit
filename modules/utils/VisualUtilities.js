// Second-level Utility (Can only require first-level utilities)

const path = require('path');
const PNGImage = require('pngjs-image');
const cheerio = require('cheerio');
const { Polygon } = require('@flatten-js/core');

const { TILE_COLORS, TILE_IDS, ELEMENT_TYPES } = require('../CONSTANTS');

let VisualUtilities = {};

const COLORS = TILE_COLORS.map(c => `rgba(${c.red},${c.green},${c.blue},${c.alpha})`);

const IMAGES = [];

// Object.keys(TILE_IDS).forEach(key => {
// 	IMAGES[TILE_IDS[key]] = loadImage(path.join(__dirname, `../assets/${key.toLowerCase()}.png`)).then(image => {
// 		IMAGES[TILE_IDS[key]] = image;
// 	});
// });

VisualUtilities.getViewBox = (width, height) => `-1 -1 ${width + 2} ${height + 2}`;

VisualUtilities.visualizeVectorMap = vectorMap => {
	const gridSVG = `<g>
		<defs>
			<pattern id="grid" x="0.5" y="0.5" width="1" height="1" patternUnits="userSpaceOnUse">
				<rect width="1" height="1" fill="white"/>
				<path d="M 1 0 L 0 0 0 1" fill="none" stroke="gray" stroke-width="0.1"/>
			</pattern>
		</defs>

		<rect x="-1" y="-1" width="100%" height="100%" fill="url(#grid)" />
	</g>`;

	const outerWallSVG = VisualUtilities.generatePolygonSVGs([vectorMap.elements.outerWall.shape.vertices], "", "outer-wall");
	const islandsSVG = VisualUtilities.generatePolygonSVGs(vectorMap.elements.islands.map(i => i.shape.vertices), "", "island");
	const gatesSVG = VisualUtilities.generatePolygonSVGs(vectorMap.elements.gates.map(g => g.shape.vertices), "", "gate");

	let elementsSVG = ["flags", "bombs", "spikes", "boosts", "powerups", "buttons"].reduce((acc, val) => {
		return acc + VisualUtilities.groupSVGElements(vectorMap.elements[val].map(e => e.visualize()));
	}, "");

	let $svg = cheerio.load(VisualUtilities.appendToSVGDoc(
		`<body>
<style>
	svg .center {
		transform-box: fill-box;
		transform-origin: center;
	}
</style>
<svg></svg></body>`,
		gridSVG,
		outerWallSVG,
		islandsSVG,
		gatesSVG,
		elementsSVG
	));

	$svg(".outer-wall").attr("style", "fill:transparent;stroke:black;");
	$svg(".outer-wall").attr("stroke-width", "0.25");
	$svg(".outer-wall").attr("stroke-linecap", "round");
	// $svg(".outer-wall").attr("transform", "translate(0.5, 0.5)");

	$svg(".island").attr("style", "fill:maroon;");

	$svg(".gate").attr("style", "fill:#111;");

	$svg("svg").attr("viewBox", VisualUtilities.getViewBox(vectorMap.width, vectorMap.height));
	$svg("svg").css("width", "512px");
	$svg("svg").css("border", "1px solid black");

	return $svg.html();
};

VisualUtilities.appendToSVGDoc = (mainDoc, ...partials) => {
	let $svg = cheerio.load(mainDoc);

	for (let i = 0; i < partials.length; i++) {
		$svg("svg").html($svg("svg").html() + partials[i]);
	}

	return $svg("svg").parent().html();
}

VisualUtilities.visualizeBoxMap = boxMap => {
	let svg = "";

	for (let i = 0; i < boxMap.length; i++) {
		svg += boxMap[i].svg();
	}

	let $svg = cheerio.load(`<svg viewBox="0 0 50 50" style="width: 48vw">${svg}</svg>`);

	$svg("rect").attr("stroke-width", "0.1");

	return $svg.html();
};

VisualUtilities.visualizeWallMap = wallMap => {
	let svg = "";

	svg += VisualUtilities.generateGridSVGs(wallMap);

	let $svg = cheerio.load(`<svg viewBox="${VisualUtilities.getViewBox(wallMap[0].length, wallMap.length)}">${svg}</svg>`);

	$svg("svg").css("width", "48vw");
	$svg("svg").css("border", "1px solid black");

	return $svg.html();
};

VisualUtilities.visualizeOptimizedWallMap = (optimizedWallMap, customCSS) => {
	let svg = "";

	let { optimizedWallMap: wallMap, outerWall } = optimizedWallMap;

	svg += VisualUtilities.generateGridSVGs(wallMap);
	svg += VisualUtilities.generatePointSVGs(outerWall, "fill:aqua;");

	let $svg = cheerio.load(`<svg>${svg}</svg>`);

	$svg("svg").css("border", "1px solid black");
	$svg("svg").css("height", "512px");
	$svg("svg").attr("viewBox", VisualUtilities.getViewBox(wallMap[0].length, wallMap.length));
	$svg("svg").css(customCSS);

	return $svg.html();
};

VisualUtilities.visualizeWallVectors = (wallVectors, customCSS) => {
	let svg = "";

	let { optimizedWallMap: wallMap, outerWall, islands } = wallVectors;

	svg += VisualUtilities.generateGridSVGs(wallMap);
	svg += VisualUtilities.generatePointSVGs(outerWall, "fill:aqua;");
	svg += VisualUtilities.generatePolygonSVGs(islands, "fill:maroon;");

	let $svg = cheerio.load(`<svg>${svg}</svg>`);

	$svg("svg").css("border", "1px solid black");
	$svg("svg").css("height", "512px");
	$svg("svg").attr("viewBox", VisualUtilities.getViewBox(wallMap[0].length, wallMap.length));
	$svg("svg").css(customCSS);

	return $svg.html();
};

VisualUtilities.generatePolygonSVGs = (polygons, style="fill:gray;", className="") => {
	let svg = "";

	for (let i = 0; i < polygons.length; i++) {
		svg += `<polygon points="${polygons[i].map(p => `${p.x},${p.y}`).join(" ")}" style="${style}" class="${className}" fill-opacity="0.7"></polygon>`;
	}
	return svg;
};

VisualUtilities.generateGridSVGs = grid => {
	let svg = "";
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0].length; x++) {
			svg += `<rect x="${x - 0.5}" y="${y - 0.5}" width="1" height="1" style="fill:${COLORS[grid[y][x]]};"></rect>`;
		}
	}
	return svg;
};

VisualUtilities.generatePointSVGs = (points, style="fill:gray;", className="") => {
	let svg = "";
	for (let i = 0; i < points.length; i++) {
		svg += `<circle cx="${points[i].x}" cy="${points[i].y}" r="0.25" style="${style}" class="${className}" fill-opacity="0.75"></circle>`;
	}
	return svg;
};

VisualUtilities.groupSVGElements = svgs => `<g>${svgs.join("").replace(/[\n\r]/g, "")}</g>`;

VisualUtilities.createImageFromMap = map => {
	return new Promise(function(resolve, reject) {
		const width = map[0].length;
		const height = map.length;

		let image = PNGImage.createImage(width, height);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let tileType = map[y][x];
				let color = TILE_COLORS[tileType];

				let pixelX = x;
				let pixelY = y;

				image.setPixel(pixelX, pixelY, color);
			}
		}

		resolve(image);
	});
}

VisualUtilities.createPreviewImageFromMap = map => {
	return new Promise(function(resolve, reject) {
		const width = map[0].length;
		const height = map.length;

		const canvas = createCanvas(width * 40, height * 40);
		const ctx = canvas.getContext('2d');

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let tileType = map[y][x];

				if(IMAGES[tileType]) ctx.drawImage(IMAGES[tileType], x * 40, y * 40);
			}
		}

		resolve(canvas.toBuffer());
	});
}

module.exports = VisualUtilities;