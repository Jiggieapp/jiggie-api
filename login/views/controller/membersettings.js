var mongo = require('./../models/mongo');
var debug = require('./../config/debug');
var async = require('async');
var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
var eventEmitter = mongo.eventEmitter;

eventEmitter.on('database_connected',function(){
	mongo.getCollection('customers',function(collection)
	{
		customers_coll = collection;
		console.log("customers connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('membersettings',function(collection)
	{
		membersettings_coll = collection;
		console.log("membersettings connected");
	});
});

exports.index = function(req,res){
	req.app.get("helpers").logging("request","get","",req);
	
	var json_data = new Object();
	get_data(req,function(rows){
		if(rows != null){
			var r_memset = rows[0];
			var r_cust = rows[1];
			
			json_data.success = true;
			json_data.data = new Object();
				json_data.data._id = r_memset._id;
				json_data.data.fb_id = r_memset.fb_id;
				json_data.data.notifications = new Object();
					
					if(typeof r_memset.notifications.feed != 'undefined'){
						json_data.data.notifications.feed = r_memset.notifications.feed;
					}else{
						json_data.data.notifications.feed = false;
					}
					
					if(typeof r_memset.notifications.chat != 'undefined'){
						json_data.data.notifications.chat = r_memset.notifications.chat;
					}else{
						json_data.data.notifications.chat = false;
					}
					
					if(typeof r_memset.notifications.location != 'undefined'){
						json_data.data.notifications.location = r_memset.notifications.location;
					}else{
						json_data.data.notifications.location = false;
					}
					
					json_data.data.account_type = r_memset.account_type;
					json_data.data.gender = r_memset.gender;
					json_data.data.experiences = r_memset.experiences;
					json_data.data.gender_interest = r_memset.gender_interest;
					json_data.data.updated_at = r_memset.updated_at;
					json_data.data.matchme = r_cust.matchme;
					json_data.data.payment = new Object;
					json_data.data.phone = r_cust.phone;
				
			res.json(json_data);
		}
	})
}

function get_data(req,next){
	var fb_id = req.param('fb_id');
	
	async.parallel([
		function get_membersettings(cb){
			membersettings_coll.findOne({fb_id:fb_id},function(err,rows){
				if(err){
					req.app.get("helpers").logging("errors","get","ERROR LINE 37 FILE membersettings.js",req);
					debug.log(err);
					cb(null,'next');
				}else{
					cb(null,rows);
				}
				
			})
		},
		function get_customers(cb){
			customers_coll.findOne({fb_id:fb_id},function(err,rows){
				if(err){
					req.app.get("helpers").logging("errors","get","ERROR LINE 48 FILE membersettings.js",req);
					debug.log(err);
					cb(null,'next');
				}else{
					cb(null,rows);
				}
			})
		}
	],function(err,merge){
		next(merge);
	})
}


exports.memberinfo = function(req,res){
	var fb_id = req.params.fb_id;
	
	customers_coll.findOne({fb_id:fb_id},function(err,rows){
		if(err){
			debug.log(err)
		}else{
			if(rows == null){
				// 403 => Invalid ID
				res.json({code_error:403})
			}else{
				res.json(rows);
			}
			
		}
	})
}