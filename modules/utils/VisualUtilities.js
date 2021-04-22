const path = require('path');
const PNGImage = require('pngjs-image');

const { TILE_COLORS, TILE_IDS } = require('../SETTINGS');

let VisualUtilities = {};

const IMAGES = [];

Object.keys(TILE_IDS).forEach(key => {
	IMAGES[TILE_IDS[key]] = loadImage(path.join(__dirname, `../assets/${key.toLowerCase()}.png`)).then(image => {
		IMAGES[TILE_IDS[key]] = image;
	});
});

VisualUtilities.visualizeWallMap = wallMap => {
	let svg = "";

	for (let y = 0; y < wallMap.length; y++) {
		for (let x = 0; x < wallMap[0].length; x++) {
			if(wallMap[y][x] === 1) svg += `<rect x="${x}" y="${y}" width="1" height="1" />`;
		}
	}

	return `<svg viewBox="0 0 ${wallMap[0].length} ${wallMap.length}" style="width: 50%">${svg}</svg>`;
};

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