var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 200, checkperiod: 120 });

module.exports = cache;