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

eventEmitter.on('database_connected',function(){
	mongo.getCollection('ref_rewardcreditsystem',function(collection){
		rewardcredit_coll = collection;
		console.log("ref_rewardcreditsystem connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('credit_points',function(collection){
		credit_points_coll = collection;
		console.log("credit_points connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('ref_promocode',function(collection){
		ref_promocode_coll = collection;
		console.log("ref_promocode connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('ref_phonebook',function(collection){
		phonebook_coll = collection;
		console.log("ref_phonebook connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('promo_rules',function(collection){
		promo_rules_coll = collection;
		console.log("promo_rules connected");
	});
});