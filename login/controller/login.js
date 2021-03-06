var mongo = require('./../models/mongo');
var debug = require('./../config/debug');
var async = require('async');
var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
var eventEmitter = mongo.eventEmitter;
var ObjectId = require('mongodb').ObjectID;

var redis   = require("redis");
var client  = redis.createClient(6379,"jiggieappsredis.futsnq.0001.apse1.cache.amazonaws.com");


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

eventEmitter.on('database_connected',function(){
	mongo.getCollection('ref_tags',function(collection)
	{
		tags_coll = collection;
		console.log("ref_tags connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('city',function(collection)
	{
		city_coll = collection;
		console.log("city connected");
	});
});

exports.index = function(req, res){
	var post = req.body;
	var cond = {fb_id:post.fb_id}
	
	debug.log('Login DATA')
	debug.log(post);
	debug.log('#############################');
	
	async.waterfall([
		function step1(callback){
			customers_coll.find(cond).toArray(function(err,rcek){
				var is_new_users = "";
				if(rcek.length > 0){
					// update data each time login //
					is_new_users = false;
					var set_customers = new Object();
					
					
					set_customers.user_first_name = post.user_first_name;
					set_customers.first_name = post.user_first_name;
					set_customers.user_last_name = post.user_last_name;
					set_customers.last_name = post.user_last_name;
					set_customers.profile_image_url = post.profile_image_url;
					set_customers.gender = post.gender;
					// set_customers.about = post.about; this update about only for first time login
					set_customers.birthday = post.birthday;
					if(typeof post.location != 'undefined'){
						set_customers.location = post.location;
					}else{
						set_customers.location = '';
					}
					
					set_customers.userId = post.userId;
					set_customers.updated_at = new Date();
					set_customers.payment = {};
					
					set_customers.age = post.age;
					
					var device_type = '';
					(typeof post.device_type != 'undefined') ? device_type = post.device_type : device_type = 1;
					if(device_type == 1 || device_type == '1'){
						set_customers.device_type_ios = true
					}else if(device_type == 2 || device_type == '2'){
						set_customers.device_type_android = true
						
					}
					
					if(String(post.device_type) == '1'){
						// set_customers.apn_token = post.apn_token;
						delete set_customers.gcm_token;
					}else if(String(post.device_type) == '2'){
						set_customers.gcm_token = post.apn_token;
						delete set_customers.apn_token;
					}
					
					customers_coll.update(cond,{$set:set_customers},function(err,upd){
						if(upd){
							debug.log("updated customers");
						}else{
							debug.log("not updated customers");
						}
						
					});
					
					membersettings_coll.findOne({fb_id:post.fb_id},function(errs,rowsmem){
						if(rowsmem == null){
							var dtmem = new Object();
							dtmem.fb_id = post.fb_id;
							dtmem.gender = post.gender;
							dtmem.notifications = new Object();
								dtmem.notifications.chat = true;
								dtmem.notifications.feed = true;
								dtmem.notifications.location = true;
							dtmem.updated_at = new Date();
							dtmem.account_type = 'host';
							dtmem.experiences = [];
							if(post.gender == 'male'){
								dtmem.gender_interest = 'female';
							}else if(post.gender == 'female'){
								dtmem.gender_interest = 'male';
							}else{
								dtmem.gender_interest = 'both';
							}
							
							
							membersettings_coll.insert(dtmem,function(err,ins){
								if(ins){
									debug.log("inserted new members");
								}else{
									debug.log("not inserted members");
								}
							})
						}
					})
					
				}else{
					// insert data each time login //
					is_new_users = true;
					
					var set_customers = new Object();
					set_customers.active = true;
					set_customers.visible = true;
					set_customers.fb_id = post.fb_id;
					set_customers.payment = new Object();
					
					set_customers.user_first_name = post.user_first_name;
					set_customers.user_last_name = post.user_last_name;
					set_customers.first_name = post.user_first_name;
					set_customers.last_name = post.user_last_name;
					set_customers.profile_image_url = post.profile_image_url;
					set_customers.gender = post.gender;
					set_customers.email = post.email;
					set_customers.photos = ['https://graph.facebook.com/'+post.fb_id+'/picture?width=1000&height=1000'];
					set_customers.about = post.about;
					set_customers.birthday = post.birthday;
					if(typeof post.location != 'undefined'){
						set_customers.location = post.location;
					}else{
						set_customers.location = '';
					}
					set_customers.userId = post.userId;
					set_customers.created_at = new Date();
					set_customers.last_login = new Date();
					set_customers.updated_at = new Date();
					set_customers.birth_date = post.birthday;
					set_customers.user_ref_name = "n/a";
					set_customers.user_ref_fb_id = "";
					set_customers.ref_count = 0;
					set_customers.appsflyer = new Object();
					set_customers.mixpanel = new Object();
					set_customers.chat_count = 0;
					set_customers.device_type = post.device_type;
					// set_customers.twilio_token = 0;
					// set_customers.tmp_phone = 0;
					
					set_customers.matchme = true;
					set_customers.phone = "";
					
					var device_type = '';
					(typeof post.device_type != 'undefined') ? device_type = post.device_type : device_type = 1;
					if(device_type == 1 || device_type == '1'){
						set_customers.device_type_ios = true
					}else if(device_type == 2 || device_type == '2'){
						set_customers.device_type_android = true
					}
					
					if(String(post.device_type) == '1'){
						// set_customers.apn_token = post.apn_token;
						delete set_customers.gcm_token;
					}else if(String(post.device_type) == '2'){
						set_customers.gcm_token = post.apn_token;
						delete set_customers.apn_token;
					}
					
					set_customers.age = post.age
					
					subscribe_mailchimp(set_customers,function(){});
			
					
					customers_coll.insert(set_customers,function(err,ins){
						if(ins){
							debug.log("inserted new customers");
						}else{
							debug.log("not inserted customers");
						}
					});
					
					membersettings_coll.findOne({fb_id:post.fb_id},function(errs,rowsmem){
						if(rowsmem == null){
							var dtmem = new Object();
							dtmem.fb_id = post.fb_id;
							dtmem.gender = post.gender;
							dtmem.notifications = new Object();
								dtmem.notifications.chat = true;
								dtmem.notifications.feed = true;
								dtmem.notifications.location = true;
							dtmem.updated_at = new Date();
							dtmem.account_type = 'host';
							dtmem.experiences = [];
							if(post.gender == 'male'){
								dtmem.gender_interest = 'female';
							}else if(post.gender == 'female'){
								dtmem.gender_interest = 'male';
							}else{
								dtmem.gender_interest = 'both';
							}
							
							
							
							membersettings_coll.insert(dtmem,function(err,ins){
								if(ins){
									debug.log("inserted new members");
								}else{
									debug.log("not inserted members");
								}
							})
						}
					})
					
				}
			});
			callback(null,post.fb_id);
		},
		function step2(res_data1,callback){
			get_data(cond,function(data){
				var json_data = new Object();
				if(data[0].length > 0){
					// json_data.success = true;
					
					if(typeof data[1][0] == "undefined"){
						json_data._id = data[0][0]._id;
						json_data.account_type = 'host';
						json_data.experiences = [];
						json_data.fb_id = post.fb_id;
						json_data.gender = post.gender;
						
						json_data.notifications = new Object();
							json_data.notifications.chat = true;
							json_data.notifications.feed = true;
						
						json_data.payment = new Object();
						json_data.phone = '';
						json_data.updated_at = new Date();
					}else{
						data[1][0].payment = new Object();
						data[1][0].phone = data[0][0].phone;
						
						json_data = data[1][0];
						
					}
					
					if(typeof data[0][0].phone == "undefined"){
						json_data.has_phone = false;
					}else{
						json_data.has_phone = true;
					}
					
					json_data.is_new_user = false;
					
					json_data.help_phone = "6466008233"; // static jiggie contact phone number
					
					json_data.matchme = data[0][0].matchme;
					
					
					// cek is still walkthrough //
					var ios_typecek = '';
					(typeof data[0][0].device_type_ios != 'undefined') ? ios_typecek = 1 : ios_typecek = 0;
					
					var android_typecek = '';
					(typeof data[0][0].device_type_android != 'undefined') ? android_typecek = 1 : android_typecek = 0;
					
					var post_device = '';
					(typeof post.device_type != 'undefined') ? post_device = post.device_type : post_device = 1;
					
					json_data.device_type = post_device;
					
					if(typeof post.device_id != 'undefined' && typeof data[0][0].list_device != 'undefined'){
						var dt_device_exist = '';
						async.forEachOf(data[0][0].list_device,function(v,k,e){
							if(v.device_id == post.device_id){
								dt_device_exist = v;
							}else{
								dt_device_exist = 0;
							}
						})
						if(dt_device_exist == 0){
							debug.log('walkthrough data zero')
							json_data.show_walkthrough_new = new Object();
							json_data.show_walkthrough_new.event = true;
							json_data.show_walkthrough_new.social = true;
							json_data.show_walkthrough_new.chat = true;
						}else{
							debug.log('walkthrough data exist')
							json_data.show_walkthrough_new = new Object();
							(dt_device_exist.event > 0) ? json_data.show_walkthrough_new.event = false : json_data.show_walkthrough_new.event = true;
							(dt_device_exist.social > 0) ? json_data.show_walkthrough_new.social = false : json_data.show_walkthrough_new.social = true;
							(dt_device_exist.chat > 0) ? json_data.show_walkthrough_new.chat = false : json_data.show_walkthrough_new.chat = true;
						}
					}else{
						debug.log('walkthrough data still undefined')
						json_data.show_walkthrough_new = new Object();
						json_data.show_walkthrough_new.event = true;
						json_data.show_walkthrough_new.social = true;
						json_data.show_walkthrough_new.chat = true;
					}
					
					json_data.show_walkthrough = false;
					
					if(typeof data[0][0].from_age != 'undefined'){
						json_data.from_age = data[0][0].from_age
					}else{
						json_data.from_age = '0'
					}
					
					if(typeof data[0][0].to_age != 'undefined'){
						json_data.to_age = data[0][0].to_age
					}else{
						json_data.to_age = '0'
					}
					
					if(typeof data[0][0].distance != 'undefined'){
						json_data.distance = data[0][0].distance
					}else{
						json_data.distance = '0'
					}
					
					if(typeof data[1][0].area_event != 'undefined'){
						json_data.area_event = data[1][0].area_event
					}else{
						json_data.area_event = ''
					}
					
					// if(post_device == 1){
						// if(ios_typecek == 1){
							// json_data.show_walkthrough = false;
						// }else if(ios_typecek == 0){
							// json_data.show_walkthrough = true;
						// }
					// }else if(post_device == 2){
						// if(android_typecek == 1){
							// json_data.show_walkthrough = false;
						// }else if(android_typecek == 0){
							// json_data.show_walkthrough = true;
						// }
					// }
					// cek is still walkthrough //
					
					callback(null,json_data);
				}else{
					// customers_coll.findOne({fb_id:post.fb_id},function(erros,dti){
						json_data.success = true;
						json_data._id = '56ab1920fefe9bb110c1c20f';
						json_data.account_type = 'host';
						json_data.experiences = [];
						json_data.fb_id = post.fb_id;
						json_data.gender = post.gender;
						
						json_data.notifications = new Object();
							json_data.notifications.chat = true;
							json_data.notifications.feed = true;
						
						if(post.gender == 'male'){
							json_data.gender_interest = 'female';
						}else if(post.gender == 'female'){
							json_data.gender_interest = 'male';
						}else{
							json_data.gender_interest = 'both';
						}
						
						json_data.payment = new Object();
						json_data.phone = '';
						json_data.updated_at = new Date();
						
						json_data.has_phone = 0;
						json_data.help_phone = "6466008233";
						json_data.is_new_user = true;
						json_data.matchme = true;
						json_data.device_type = post.device_type;
						json_data.show_walkthrough = true;
						json_data.show_walkthrough_new = new Object();
						json_data.show_walkthrough_new.event = true;
						json_data.show_walkthrough_new.social = true;
						json_data.show_walkthrough_new.chat = true;
						
						json_data.from_age = '0';
						json_data.to_age = '0';
						json_data.distance = '0';
						json_data.area_event = '';
						
						callback(null,json_data);
					// })
				}
			});
		}
	],function(err,merge){
		try{
			if(err){
				throw err;
			}else{
				req.app.get("helpers").logging("response","post",JSON.stringify(merge),req);
				res.json(merge);
			}
		}catch(e){
			req.app.get("helpers").logging("response","post",JSON.stringify(e),req);
			debug.log(e);
		}
	});
};

exports.sync_countwalkthrough = function(req,res){
	var post = req.body;
	var fb_id = post.fb_id;
	var tab = post.tab;
	var device_id = post.device_id;
	debug.log(post);
	
	if(typeof fb_id == 'undefined' || fb_id == '' || typeof tab == 'undefined' || tab == '' || typeof device_id == 'undefined' || device_id == ''){
		debug.log('data post empty');
		res.json({code_error:403});
	}else{
		var cond = {
			fb_id:fb_id,
			"list_device.device_id":device_id
		}
		
		customers_coll.findOne(cond,function(err,r){
			if(err){
				debug.log('error line 362')
				res.json({code_error:403})
			}else{
				if(r == null){
					debug.log('one')
					var form_update = new Object();
					form_update.device_id = device_id;
					form_update.event = 0;
					form_update.social = 0;
					form_update.chat = 0;
					if(tab == 'event'){
						form_update.event = 1;
					}else if(tab == 'social'){
						form_update.social = 1;
					}else if(tab == 'chat'){
						form_update.chat = 1;
					}
					customers_coll.update({fb_id:fb_id},{$push:{list_device:form_update}},function(err2,upd){
						if(err){
							debug.log('line error 383');
							res.json({code_error:403});
						}else{
							res.json({success:true});
						}
					})
				}else{
					debug.log('two')
					var form_update = new Object();
					async.forEachOf(r.list_device,function(v,k,e){
						if(v.device_id == device_id){
							form_update = v;
						}
					})
					if(tab == 'event'){
						form_update.event = parseInt(form_update.event)+1;
					}else if(tab == 'social'){
						form_update.social = parseInt(form_update.social)+1;
					}else if(tab == 'chat'){
						form_update.chat = parseInt(form_update.chat)+1;
					}
					
					var upd_form = {
						$set:{"list_device.$":form_update}
					}
					customers_coll.update(cond,upd_form,function(err2,upd){
						if(err){
							debug.log('line error 404');
							res.json({code_error:403});
						}else{
							res.json({success:true});
						}
					})
					
					
				}
				
				
				
			}
		})
	}
}

exports.sync_membersettings = function(req,res){
	var post = req.body;
	var cond = {fb_id:post.fb_id}
	
	debug.log('membersettings_data');
	debug.log(post);
	debug.log('###########################');
	
	if(typeof post.gender != 'undefined'){
		var dt = new Object();
		if(typeof post.gender != 'undefined'){dt.gender = post.gender;}
		customers_coll.update({fb_id:post.fb_id},{$set:dt},function(){});
	}
	
	if(typeof post.from_age != 'undefined' && typeof post.to_age != 'undefined'){
		var dt = new Object();
		dt.from_age = post.from_age;
		dt.to_age = post.to_age;
		customers_coll.update({fb_id:post.fb_id},{$set:dt},function(){});
	}
	
	if(typeof post.distance != 'undefined'){
		var dt = new Object();
		dt.distance = post.distance;
		customers_coll.update({fb_id:post.fb_id},{$set:dt},function(){});
	}
	
	
	
	var json_data = new Object();
	if(typeof post.fb_id != 'undefined'){json_data.fb_id = post.fb_id;}
	if(typeof post.gender != 'undefined'){json_data.gender = post.gender;}
	
	json_data.notifications = new Object();
	if(typeof post.chat != 'undefined'){
		(post.chat == 1) ? json_data.notifications.chat = true : json_data.notifications.chat = false;
	}
	
	if(typeof post.feed != 'undefined'){
		(post.feed == 1) ? json_data.notifications.feed = true : json_data.notifications.feed = false;
	}
	
	if(typeof post.location != 'undefined'){
		(post.location == 1) ? json_data.notifications.location = true : json_data.notifications.location = false;
	}
	
	if(JSON.stringify(json_data.notifications) == '{}'){
		delete json_data.notifications;
	}
	
	json_data.updated_at = new Date();
	if(typeof post.account_type != 'undefined'){json_data.account_type = post.account_type;}
	
	if(typeof post.experiences != 'undefined'){json_data.experiences = post.experiences.split(",");}else{
		membersettings_coll.findOne({fb_id:post.fb_id},function(ersd,rt){
			if(rt != null){
				if(rt.experiences.length == 0){
					json_data.experiences = [];
				}
			}else{
				json_data.experiences = [];
			}
		})
	}
	
	if(typeof post.gender_interest != 'undefined'){json_data.gender_interest = post.gender_interest;}
	if(typeof post.area_event != 'undefined'){json_data.area_event = post.area_event;}
	
	if(typeof post.fb_id != 'undefined'){
		membersettings_coll.find(cond).toArray(function(err,rows){
			if(rows.length > 0){
				// if already exist update
				membersettings_coll.update(cond,{$set:json_data},function(err,upd){
					if(upd){
						debug.log("updated membersettings");
						res.json({"success":true});
					}else{
						debug.log("failed updated membersettings");
						res.json({"success":false});
					}
				});
			}else{
				if(typeof post.photos != 'undefined'){
					var dt = new Object();
					dt.profile_image_url = post.photos[0];
					dt.photos = post.photos;
					if(typeof post.gender != 'undefined'){dt.gender = post.gender;}
					customers_coll.update({fb_id:post.fb_id},{$set:dt},function(){});
				}
				// if not exist insert
				membersettings_coll.insert(json_data,function(err,ins){
					if(ins){
						debug.log("Inserted New Member Settings");
						res.json({"success":true});
					}else{
						debug.log("Failed Inserted New Member Settings");
						res.json({"success":false});
					}
				});
			}
		});
	}else{
		debug.log('FB ID Undefined');
		res.json({code_error:403});
	}
}

exports.sync_mixpanel = function(req,res){
	req.app.get("helpers").logging("request","post",JSON.stringify(req.body),req);
	var post = req.body;
	var cond = {fb_id:post.fb_id}
	var coll = "customers";
	
	var json_data = new Object();
	json_data.mixpanel = post;
	customers_coll.update(cond,{$set:json_data},function(err,upd){
		if(upd){
			debug.log("updated mixpanel");
			req.app.get("helpers").logging("response","post",JSON.stringify({"success":true}),req);
			res.json({"success":true});
		}else{
			debug.log("failed updated mixpanel");
			req.app.get("helpers").logging("response","post",JSON.stringify({"success":false}),req);
			res.json({"success":false});
		}
		
	});
}

exports.sync_appsflyer = function(req,res){
	req.app.get("helpers").logging("request","post",JSON.stringify(req.body),req);
	var post = req.body;
	var cond = {fb_id:post.fb_id}
	var coll = "customers";
	debug.log("APPSFLYER DATAAA");
	debug.log(post);
	
	customers_coll.findOne(cond,function(err,rows){
		if(JSON.stringify(rows.appsflyer) == "{}"){
			debug.log('trying updating appsflyer data');
			// if not exist updated
			var json_data = new Object();
			json_data.appsflyer = JSON.parse(post.appsflyer);
			debug.log(json_data);
			
			customers_coll.update(cond,{$set:json_data},function(err,upd){
				if(upd){
					req.app.get("helpers").logging("response","post",JSON.stringify({"success":true}),req);
					res.json({"success":true});
				}else{
					req.app.get("helpers").logging("response","post",JSON.stringify({"success":false}),req);
					res.json({"success":false});
				}
			});
		}else{
			debug.log('failed updated appsflyer data');
			// if already exist not updated
			res.json({"success":false,"reason":"query wrong"});
		};
	})
}


function get_data(cond,next){
	async.parallel([
		function get_customers(callback){
			customers_coll.find(cond).toArray(function(err,rows){
				callback(null,rows);
			});
		},
		function get_membersettings(callback){
			membersettings_coll.find(cond).toArray(function(err,rowsmem){
				callback(null,rowsmem);
			});
		}
	],function(err,merge){
		try{
			if(err){
				throw err;
			}else{
				next(merge);
			}
		}catch(e){
			debug.log(e);
		}
	});
}


exports.sync_about = function(req,res){
	var post = req.body;
	var fb_id = post.fb_id;
	var about = post.about;
	debug.log(post);
	
	customers_coll.findOne({fb_id:fb_id},function(errs,r){
		if(r != null){
			customers_coll.update({_id:new ObjectId(r._id)},{$set:{about:about}},function(err,upd){
				if(err){
					req.app.get("helpers").logging("errors","post","errors line 483 "+JSON.stringify(err),req);
					debug.log(err);
				}else{
					res.json({success:true});
				}
			})
		}else{
			// 403 => Invalid ID
			res.json({code_error:403})
		}
	})
}

exports.userlogin = function(req,res){
	var jwt = require('jsonwebtoken');
	var datakey = 'Wk0rXZTxsesP99giBjIm12Vbq8nPbW4chfudbcAdmindjjJannesSantoso123JJJjklsqiiSecretDataKey90909087869';

	var post = req.body;
	var fb_token = post.fb_token;
	
	client.get('token_'+fb_token,function(err,val){
		// if(val == null){
			var json_data = {
				fb_token : fb_token
			}
			var options = {
				algoritm:'ES512',
				expiresIn:'120m'
			}
			
			jwt.sign(json_data,datakey,options,function(token){
				client.set('token_'+fb_token,JSON.stringify(token),function(err,suc){
					if(!err){
						debug.log('token requested success');
						client.expire('token_'+fb_token,7000);
						res.json({"success":true,token:token});
					}else{
						debug.log('server problem')
						res.json({"success":false,msg:"Server Problem"});
					}
				})
				
			})
			
		// }else{
			// debug.log('token still active')
			// res.json({"success":false,msg:"Token Not Expired"});
		// }
	})
	
	
}


exports.tagslist = function(req,res){
	tags_coll.find({}).toArray(function(err,r){
		if(r.length > 0){
			var data = [];
			var n = 0;
			async.forEachOf(r,function(v,k,e){
				data[n] = v.ref_title;
				n++;
			})
			res.json(data);
		}
	})
}

exports.citylist = function(req,res){
	city_coll.find({status:true}).toArray(function(err,r){
		if(r.length > 0){
			res.json(r);
		}
	})
}

exports.sync_apntoken = function(req,res){
	var fb_id = req.params.fb_id;
	var apn = req.params.apn;
	
	customers_coll.update({fb_id:fb_id},{$set:{apn_token:apn}},function(err,upd){
		if(err){
			res.json({code_error:403})
		}else{
			res.json({success:true});
		}
	})
}

function subscribe_mailchimp(user_item,callback){
	var util = require('util');
	var apiKey = "c1d7049153ed19e8424505abc495f565-us12";

	var mcapi = require('mailchimp-api')
	var MC = new mcapi.Mailchimp('c1d7049153ed19e8424505abc495f565-us12');
	var listIDMale = "0ca7cb8453";
	var listIDFemale = "eb9f283bf6";

	var listID = "8310248493";
	
	MC.lists.subscribe({
		id:listID, 
		email:{email:user_item.email},
		merge_vars:
			{
				FNAME:user_item.first_name,
				LNAME 	: user_item.last_name,
				MMERGE3 : user_item.fb_id,
				MMERGE4 : user_item.gender,
				MMERGE5 : user_item.birthday,
				MMERGE6 : user_item.location,
				MMERGE7 : user_item.created_at,
				MMERGE8 :user_item.about
			},
			update_existing:true,
			double_optin:false
	}, function(data)
	{
		callback()
		console.log("mailchimp====success=== " + util.inspect(data))
	},function(error)
	{
		callback()
		console.log("mailchimp====error=== " + error)
	});
}