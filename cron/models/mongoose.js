var mongoose = require('mongoose');

var fs = require('fs');
var path = require('path');
var ppt = path.join(__dirname,"../../global/db.json");
fs.readFile(ppt,"utf-8",function(err,data){
	var obj = JSON.parse(data);
	mongoose.connect(obj.mongoUri);
})

