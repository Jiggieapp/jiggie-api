var mongo = require('./mongo');
var eventEmitter = mongo.eventEmitter;

eventEmitter.on('database_connected',function(){
	mongo.getCollection('invitelinks',function(collection){
		invitelinks_coll = collection;
		console.log("invitelinks connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('events_details',function(collection){
		events_detail_coll = collection;
		console.log("events_detail connected");
	});
});