var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 20, checkperiod: 20 });

module.exports = cache;