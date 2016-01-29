var mongo = require('./../models/mongo');
var debug = require('./../config/debug');
// var async = require('async');
var eventEmitter = mongo.eventEmitter;
// var ObjectId = require('mongodb').ObjectID;

eventEmitter.on('database_connected',function(){
	mongo.getCollection('log',function(collection){
		log_coll = collection;
		console.log("log connected");
	});
});

exports.index = function(req, res){
	var post = req.body;
	
	var json_data = new Object();
	json_data.type = post.type; // request or response
	json_data.route = post.route;
	json_data.method = post.method;
	json_data.api = post.api;
	json_data.created_at = new Date();
	
	log_coll.insert(json_data,function(err,ins){
		if(err){
			debug.log(err);
		}else{
			debug.log(ins);
		}
	})
	
};
