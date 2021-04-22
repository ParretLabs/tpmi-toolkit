const {TILE_COLORS, TILE_IDS} = require('../SETTINGS');

let Utilities = {};

Utilities.createEmpty2dArray = (w, h) => Array(h).fill(0).map(a => Array(w).fill(0));

Utilities.seed = function(s) {
	let mask = 0xffffffff;
	let m_w  = (123456789 + s) & mask;
	let m_z  = (987654321 - s) & mask;

	return function() {
		m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
		m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;

		let result = ((m_z << 16) + (m_w & 65535)) >>> 0;
		result /= 4294967296;
		return result;
	}
}

Utilities.random = Utilities.seed(Date.now());

Utilities.getRandomInt = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

Utilities.getSeededRandomInt = (randomFunc, min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(randomFunc() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

Utilities.tileToHex = (tile)  => {
	return Utilities.rgbToHex(TILE_COLORS[tile].r, TILE_COLORS[tile].b, TILE_COLORS[tile].g);
}

Utilities.hexToRGB = hex => {
	let b = hex >> 16;
	let g = hex >> 8 & 0xFF;
	let r = hex & 0xFF;
	return [r,g,b];
}

Utilities.rgbToHex = (r, g, b) => {
	return "#" + Utilities.componentToHex(r) + Utilities.componentToHex(g) + Utilities.componentToHex(b);
}

Utilities.componentToHex = (c)  => {
	let hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

module.exports = Utilities;