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

eventEmitter.on('database_connected',function(){
	mongo.getCollection('events_details',function(collection){
		events_detail_coll = collection;
		console.log("event_details connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('partyfeed',function(collection){
		partyfeed_coll = collection;
		console.log("partyfeed connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('ref_rewardcreditsystem',function(collection){
		rewardcredit_coll = collection;
		console.log("ref_rewardcreditsystem connected");
	});
});