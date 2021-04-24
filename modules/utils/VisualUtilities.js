const path = require('path');
const PNGImage = require('pngjs-image');
const cheerio = require('cheerio');

const { TILE_COLORS, TILE_IDS } = require('../SETTINGS');

let VisualUtilities = {};

const IMAGES = [];

// Object.keys(TILE_IDS).forEach(key => {
// 	IMAGES[TILE_IDS[key]] = loadImage(path.join(__dirname, `../assets/${key.toLowerCase()}.png`)).then(image => {
// 		IMAGES[TILE_IDS[key]] = image;
// 	});
// });

VisualUtilities.visualizeVectorMap = vectorMap => {
	const gridSVG = `<g>
		<defs>
			<pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
				<rect width="1" height="1" fill="white"/>
				<path d="M 1 0 L 0 0 0 1" fill="none" stroke="gray" stroke-width="0.1"/>
			</pattern>
		</defs>

		<rect x="-0.5" y="-0.5" width="100%" height="100%" fill="url(#grid)" />
	</g>`;
	const wallSVG = VisualUtilities.groupSVGElements(vectorMap.walls.map(w => {
		let $line = cheerio.load(w.svg());

		$line("line").attr("data-branch", w.branch);

		return $line("line").parent().html();
	}));
	const flagSVG = VisualUtilities.groupSVGElements(vectorMap.flags.map(f => f.visualize()));

	let $svg = cheerio.load("<body><svg></svg></body>");

	$svg("svg").html($svg("svg").html() + gridSVG);

	$svg("svg").html($svg("svg").html() + wallSVG);

	$svg("svg").html($svg("svg").html() + flagSVG);

	$svg("line").attr("stroke-width", "0.25");
	$svg("line").attr("stroke-linecap", "round");

	$svg("svg").attr("viewBox", `-1 -1 ${vectorMap.width + 2} ${vectorMap.height + 2}`);
	$svg("svg").css("width", "50%");

	return $svg.html();
};

VisualUtilities.visualizeBoxMap = boxMap => {
	let svg = "";

	for (let i = 0; i < boxMap.length; i++) {
		svg += boxMap[i].svg();
	}

	let $svg = cheerio.load(`<body><svg viewBox="0 0 50 50" style="width: 50%">${svg}</svg></body>`);

	$svg("rect").attr("stroke-width", "0.1");

	return $svg("body").html();
};

VisualUtilities.visualizeWallMap = wallMap => {
	let svg = "";

	for (let y = 0; y < wallMap.length; y++) {
		for (let x = 0; x < wallMap[0].length; x++) {
			if(wallMap[y][x] === 1) svg += `<rect x="${x}" y="${y}" width="1" height="1" />`;
		}
	}

	return `<svg viewBox="0 0 ${wallMap[0].length} ${wallMap.length}" style="width: 50%">${svg}</svg>`;
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