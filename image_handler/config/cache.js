var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 0, checkperiod: 600 });

module.exports = cache;