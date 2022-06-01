// Second-level Utility (Can only require first-level utilities)

const path = require('path');
const PNGImage = require('pngjs-image');
const cheerio = require('cheerio');

const { TILE_COLORS, TILE_IDS, ELEMENT_TYPES } = require('../CONSTANTS');

let VisualUtilities = {};

const COLORS = TILE_COLORS.map(c => `rgba(${c.red},${c.green},${c.blue},${c.alpha})`);

const IMAGES = [];

// Object.keys(TILE_IDS).forEach(key => {
// 	IMAGES[TILE_IDS[key]] = loadImage(path.join(__dirname, `../assets/${key.toLowerCase()}.png`)).then(image => {
// 		IMAGES[TILE_IDS[key]] = image;
// 	});
// });

VisualUtilities.visualizeVectorMap = vectorMap => {
	const gridSVG = `<g>
		<defs>
			<pattern id="grid" x="0.5" y="0.5" width="1" height="1" patternUnits="userSpaceOnUse">
				<rect width="1" height="1" fill="white"/>
				<path d="M 1 0 L 0 0 0 1" fill="none" stroke="gray" stroke-width="0.1"/>
			</pattern>
		</defs>

		<rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
	</g>`;

	const outerWallSVG = VisualUtilities.generatePolygonSVGs(vectorMap.elements.outerWall, "", "outer-wall");
	const islandsSVG = VisualUtilities.generatePolygonSVGs(vectorMap.elements.islands, "", "island");
	let elementsSVG = ["flags", "bombs", "spikes"].reduce((acc, val) => {
		return acc + VisualUtilities.groupSVGElements(vectorMap.elements[val].map(e => e.visualize()));
	}, "");

	let $svg = cheerio.load(VisualUtilities.appendToSVGDoc(
		`<body><svg></svg></body>`,
		outerWallSVG,
		islandsSVG,
		elementsSVG
	));

	$svg(".outer-wall").attr("style", "fill:transparent;stroke:black;");
	$svg(".outer-wall").attr("stroke-width", "0.25");
	$svg(".outer-wall").attr("stroke-linecap", "round");

	$svg(".island").attr("style", "fill:maroon;");

	$svg("svg").attr("viewBox", `-1 -1 ${vectorMap.width + 1} ${vectorMap.height + 1}`);
	$svg("svg").css("width", "48vw");
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

	for (let y = 0; y < wallMap.length; y++) {
		for (let x = 0; x < wallMap[0].length; x++) {
			svg += `<rect x="${x}" y="${y}" width="1" height="1" style="fill:${COLORS[wallMap[y][x]]};" />`;
		}
	}

	let $svg = cheerio.load(`<svg viewBox="0 0 ${wallMap[0].length} ${wallMap.length}">${svg}</svg>`);

	$svg("svg").css("width", "48vw");
	$svg("svg").css("border", "1px solid black");

	return $svg.html();
};

VisualUtilities.visualizeOptimizedWallMap = (optimizedWallMap, customCSS) => {
	let svg = "";

	let { optimizedWallMap: wallMap, outerWall } = optimizedWallMap;

	svg += VisualUtilities.generateGridSVGs(wallMap);

	for (let i = 0; i < outerWall.length; i++) {
		svg += `<circle cx="${outerWall[i].x + 0.5}" cy="${outerWall[i].y + 0.5}" r="0.25" style="fill:aqua;" fill-opacity="0.4" />`;
	}

	let $svg = cheerio.load(`<svg viewBox="0 0 ${wallMap[0].length} ${wallMap.length}">${svg}</svg>`);

	$svg("svg").css("border", "1px solid black");
	$svg("svg").css("height", "512px");
	$svg("svg").css(customCSS);

	return $svg.html();
};

VisualUtilities.visualizeWallVectors = (wallVectors, customCSS) => {
	let svg = "";

	let { optimizedWallMap: wallMap, outerWall, islands } = wallVectors;

	svg += VisualUtilities.generateGridSVGs(wallMap);
	svg += VisualUtilities.generatePointSVGs(outerWall, "fill:aqua;");
	svg += VisualUtilities.generatePolygonSVGs(islands, "fill:maroon;");

	let $svg = cheerio.load(`<svg viewBox="0 0 ${wallMap[0].length} ${wallMap.length}">${svg}</svg>`);

	$svg("svg").css("border", "1px solid black");
	$svg("svg").css("height", "512px");
	$svg("svg").css(customCSS);

	return $svg.html();
};

VisualUtilities.generatePolygonSVGs = (polygons, style="fill:gray;", className="") => {
	let svg = "";
	for (let i = 0; i < polygons.length; i++) {
		svg += `<polygon points="${polygons[i].map(p => `${p.x + 0.5},${p.y + 0.5}`).join(" ")}" style="${style}" class="${className}" fill-opacity="0.7" />`;
	}
	return svg;
};

VisualUtilities.generateGridSVGs = grid => {
	let svg = "";
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0].length; x++) {
			svg += `<rect x="${x}" y="${y}" width="1" height="1" style="fill:${COLORS[grid[y][x]]};" />`;
		}
	}
	return svg;
};

VisualUtilities.generatePointSVGs = (points, style="fill:gray;", className="") => {
	let svg = "";
	for (let i = 0; i < points.length; i++) {
		svg += `<circle cx="${points[i].x + 0.5}" cy="${points[i].y + 0.5}" r="0.25" style="${style}" class="${className}" fill-opacity="0.75" />`;
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