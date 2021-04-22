const Utilities = require('./Utilities');

let GeometryUtilities = {};

GeometryUtilities.hashSegment = segment => {
	return Utilities.hashNumberArray([segment.start.x, segment.start.y, segment.end.x, segment.end.y]);
};

module.exports = GeometryUtilities;