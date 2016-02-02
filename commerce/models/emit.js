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
	mongo.getCollection('events_details',function(collection){
		events_detail_coll = collection;
		console.log("event_details connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('tickets',function(collection){
		tickets_coll = collection;
		console.log("tickets connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('tickettypes',function(collection){
		tickettypes_coll = collection;
		console.log("tickettypes connected");
	});
});