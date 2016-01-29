var mongo = require('./mongo');
var eventEmitter = mongo.eventEmitter;

eventEmitter.on('database_connected',function(){
	mongo.getCollection('membersettings',function(collection){
		membersettings_coll = collection;
		console.log("membersettings connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('customers',function(collection){
		customers_coll = collection;
		console.log("customers connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('socialfeed',function(collection){
		socialfeed_coll = collection;
		console.log("socialfeed connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('chatmessages',function(collection){
		chatmessages_coll = collection;
		console.log("chatmessages connected");
	});
});