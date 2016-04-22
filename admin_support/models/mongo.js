var events = require('events');
var eventEmitter = new events.EventEmitter();
exports.eventEmitter = eventEmitter;
eventEmitter.setMaxListeners(0);
var database = null;
var mongodb = require('mongodb').MongoClient;

var fs = require('fs');
var path = require('path');
var ppt = path.join(__dirname,"../../global/db.json");
fs.readFile(ppt,"utf-8",function(err,data){
	var obj = JSON.parse(data);
	mongodb.connect(obj.mongoUri,function(error, db){       
		if(error){
			console.log(error)
		}else{
			console.log("db connected, db: " + db);
		}

		database = db;
		database.addListener("error", function(error)
		{
			console.log("Error connecting to MongoLab");
		});
		eventEmitter.emit('database_connected');
	});
});



exports.getCollection = function(name, callback)
{
    collection = database.collection(name);
    callback(collection)
}