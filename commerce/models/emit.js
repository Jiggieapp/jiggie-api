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

eventEmitter.on('database_connected',function(){
	mongo.getCollection('order_products',function(collection){
		order_coll = collection;
		console.log("order_products connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('bt_instructions',function(collection){
		btins_coll = collection;
		console.log("bt_instructions connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('venues',function(collection){
		venues_coll = collection;
		console.log("venues connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('payment_method',function(collection){
		payment_method_coll = collection;
		console.log("payment_method connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('support',function(collection){
		support_coll = collection;
		console.log("support connected");
	});
});