var mongo = require('./mongo');
var eventEmitter = mongo.eventEmitter;

eventEmitter.on('database_connected',function(){
	mongo.getCollection('events',function(collection){
		events_coll = collection;
		console.log("events connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('membersettings',function(collection){
		membersettings_coll = collection;
		console.log("membersettings connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('venues',function(collection){
		venues_coll = collection;
		console.log("venues connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('events_details',function(collection){
		events_detail_coll = collection;
		console.log("events_detail connected");
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
	mongo.getCollection('tickettypes',function(collection){
		tickettypes_coll = collection;
		console.log("tickettypes connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('order_products',function(collection){
		order_coll = collection;
		console.log("order_products connected");
	});
});