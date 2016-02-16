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
			
			
				json_data._id = r_memset._id;
				json_data.fb_id = r_memset.fb_id;
				json_data.notifications = new Object();
					
					if(typeof r_memset.notifications.feed != 'undefined'){
						json_data.notifications.feed = r_memset.notifications.feed;
					}else{
						json_data.notifications.feed = false;
					}
					
					if(typeof r_memset.notifications.chat != 'undefined'){
						json_data.notifications.chat = r_memset.notifications.chat;
					}else{
						json_data.notifications.chat = false;
					}
					
					if(typeof r_memset.notifications.location != 'undefined'){
						json_data.notifications.location = r_memset.notifications.location;
					}else{
						json_data.notifications.location = false;
					}
					
					json_data.account_type = r_memset.account_type;
					json_data.gender = r_memset.gender;
					json_data.experiences = r_memset.experiences;
					json_data.gender_interest = r_memset.gender_interest;
					json_data.updated_at = r_memset.updated_at;
					json_data.matchme = r_cust.matchme;
					json_data.payment = new Object;
					json_data.phone = r_cust.phone;
				
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

exports.sendSMS = function(req,res){
	var phone = req.params.phone;
	var fb_id = req.params.fb_id;
	
	if(phone == undefined){
		res.json({"success":false,"reason":"phone is undefined"});
		return;
	}
	var phone = String(req.params.phone).replace( /[^0-9]/g, '' )

	var token = "";
	for (var i = 0; i < 6; i++)
	{
		token += String(Math.round(Math.random() * 9));
	};

	customers_coll.update({fb_id:fb_id},{$set:{tmp_phone:phone,twilio_token:token}},function(err,upd){
		if(err){
			console.log(err)
		}else{
			sendSMSConfirm(phone,token,function(){
				res.json({success:true})
			})
		}
	})
}

exports.validateSMS = function(req,res){
	var fb_id = req.params.fb_id;
	var token = String(req.params.token).replace( /[^0-9]/g, '' )
	
	customers_coll.findOne({fb_id:fb_id},function(err,r){
		if(err){
			res.json({code_error:503})
		}else{
			if(typeof r.twilio_token != 'undefined' && r.twilio_token != '' && r.tmp_phone != '' && typeof r.tmp_phone != 'undefined'){
				debug.log(r.twilio_token);
				debug.log(token);
				if(token == r.twilio_token){
					customers_coll.update({fb_id:fb_id},{$set:{phone:r.tmp_phone,verifiedbyphone:true}},function(err2,upd){
						res.json({success:true})
					})
				}else{
					debug.log('Twilio Token Error')
					res.json({code_error:401})
				}
				
			}else{
				debug.log('data empty')
				res.json({code_error:401})
			}
		}
	})
}

function sendSMSConfirm(phone,dttoken,callback){
	var accountSid = 'AC2e411537efa8bd75d3f4bd72624cf7ff'; 
	var authToken = '2ef11198d624fab5b23f009d53a3035a'; 
	 
	var client = require('twilio')(accountSid, authToken);
	client.messages.create({
		to:'+' + phone,
		from: '+12248032473', 
		body: 'Your pin is ' + dttoken
	}, function(err, message) {
		if(err){
			console.log(err);
		}else{
			console.log(message);
		}
		callback();
	});
}