let GeometryUtilities = {};

GeometryUtilities.hashSegment = segment => {
	return hashNumberArray([segment.start.x, segment.start.y, segment.end.x, segment.end.y]);
};

function hashNumberArray(numbers, maxBytes=8) {
	return parseInt(numbers.reduce((acc, val) => acc + val.toString(2).padStart(maxBytes, "0"), ""), 2);
}

module.exports = GeometryUtilities;