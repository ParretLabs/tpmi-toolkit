const TILE_IDS = {
	FLOOR: 0,
	WALL: 1,
	BACKGROUND: 2,
	REDFLAG: 3,
	BLUEFLAG: 4,
	BOMB: 5,
	SPIKE: 6,
	POWERUP: 7,
	BOOST: 8,
	GATE: 9,
	BUTTON: 10,
	REDBOOST: 11,
	BLUEBOOST: 12,
	REDTEAMTILE: 13,
	BLUETEAMTILE: 14,
	YELLOWTEAMTILE: 15,
	TLWALL: 16,
	TRWALL: 17,
	BLWALL: 18,
	BRWALL: 19
};

const TILE_COLORS = [
	{ red: 212, green: 212, blue: 212, alpha: 255 }, // Floor
	{ red: 120, green: 120, blue: 120, alpha: 255 }, // Wall
	{ red: 0, green: 0, blue: 0, alpha: 255 }, // Background
	{ red: 255, green: 0, blue: 0, alpha: 255 }, // Red Flag
	{ red: 0, green: 0, blue: 255, alpha: 255 }, // Blue Flag
	{ red: 255, green: 128, blue: 0, alpha: 255 }, // Bomb
	{ red: 55, green: 55, blue: 55, alpha: 255 }, // Spike
	{ red: 0, green: 255, blue: 0, alpha: 255 }, // Powerup
	{ red: 255, green: 255, blue: 0, alpha: 255 }, // Boost
	{ red: 0, green: 117, blue: 0, alpha: 255 }, // Gate
	{ red: 185, green: 122, blue: 87, alpha: 255 }, // Button
	{ red: 255, green: 115, blue: 115, alpha: 255 }, // Red Boost
	{ red: 115, green: 115, blue: 255, alpha: 255 }, // Blue Boost
	{ red: 220, green: 186, blue: 186, alpha: 255 }, // Red Team Tile
	{ red: 187, green: 184, blue: 221, alpha: 255 }, // Blue Team Tile
	{ red: 220, green: 220, blue: 186, alpha: 255 }, // Yellow Team Tile
	{ red: 64, green: 128, blue: 80, alpha: 255 }, // Top Left 45 Wall
	{ red: 64, green: 80, blue: 128, alpha: 255 }, // Top Right 45 Wall
	{ red: 128, green: 112, blue: 64, alpha: 255 }, // Bottom Left 45 Wall
	{ red: 128, green: 64, blue: 112, alpha: 255 }, // Bottom Right 45 Wall
];

// Clockwise, starting from the top neighbor
const NEIGHBOR_VECTORS = [
	{x: 0, y: -1}, // 0
	{x: 1, y: -1}, // 1
	{x: 1, y: 0},  // 2
	{x: 1, y: 1},  // 3
	{x: 0, y: 1},  // 4
	{x: -1, y: 1}, // 5
	{x: -1, y: 0}, // 6
	{x: -1, y: -1} // 7
];

const SYMMETRY = {
	ROTATIONAL: "R",
	HORIZONTAL: "H",
	VERTICAL: "V",
	FOURWAY: "F"
};

module.exports = { TILE_IDS, TILE_COLORS, NEIGHBOR_VECTORS, SYMMETRY };