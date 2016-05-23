var mongo = require('./../models/mongo');
var debug = require('./../config/debug');
var async = require('async');
var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
var eventEmitter = mongo.eventEmitter;
var fs = require('fs')
var xssFilters = require('xss-filters');

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
	mongo.getCollection('image_temp',function(collection){
		image_temp_coll = collection;
		console.log("image_temp connected");
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
				
				if(typeof r_cust.from_age != 'undefined'){
					json_data.from_age = r_cust.from_age
				}else{
					json_data.from_age = 0
				}
				
				if(typeof r_cust.to_age != 'undefined'){
					json_data.to_age = r_cust.to_age
				}else{
					json_data.to_age = 0
				}
				
				if(typeof r_cust.distance != 'undefined'){
					json_data.distance = r_cust.distance
				}else{
					json_data.distance = 0
				}
				
				if(typeof r_memset.area_event != 'undefined'){
					json_data.area_event = r_memset.area_event
				}else{
					json_data.area_event = 0
				}
				
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
		membersettings_coll.findOne({fb_id:fb_id},function(err2,rows_mems){
			if(err){
				debug.log(err)
			}else{
				if(rows == null){
					// 403 => Invalid ID
					res.json({code_error:403})
				}else{
					var path = require('path');
					var ppt = path.join(__dirname,"../../global/img.json");
					var pkg = require('fs-sync').readJSON(ppt);
					var imgurl = pkg.uri
					var photos = []
					async.forEachOf(rows.photos,function(v,k,e){
						photos[k] = imgurl+'image/'+fb_id+'/'+k+'/?imgid='+v
					})
					rows.photos = photos;
					if(typeof rows.country_code == 'undefined'){
						rows.country_code = new Object()
					}else{
						rows.country_code.dial_code = rows.country_code.country_code
						delete rows.country_code.country_code
					}

					if(typeof rows_mems.area_event != 'undefined'){
						rows.area_event = rows_mems.area_event;
					}else{
						rows.area_event = "";
					}
					
					
					res.json(rows);
				}
				
			}
		})
	})
}

exports.sendSMS = function(req,res){
	var countries        = require('country-data').countries,
    currencies       = require('country-data').currencies,
    regions          = require('country-data').regions,
    languages        = require('country-data').languages,
    callingCountries = require('country-data').callingCountries;
	
	var phone = req.params.phone;
	var fb_id = req.params.fb_id;
	var dial_code = req.params.dial_code;
	
	var country_code = new Object();
	async.forEachOf(countries.all,function(v,k,e){
		if(v.countryCallingCodes[0] == '+'+dial_code){
			country_code = {
				phone : phone,
				country_code: dial_code,
				currencies : v.currencies[0],
				alpha2:v.alpha2,
				alpha3:v.alpha3,
				languages:v.languages[0],
				name:v.name,
				status:v.status,
				fb_id:fb_id
			};
			
		}
	})
	
	if(JSON.stringify(country_code) == '{}'){
		debug.log('country code error')
		res.json({code_error:403});
		return;
	}
	
	if(phone == undefined){
		debug.log('phone error')
		res.json({code_error:403});
		return;
	}
	var phone = String(req.params.phone).replace( /[^0-9]/g, '' )

	var token = "";
	for (var i = 0; i < 6; i++)
	{
		token += String(Math.round(Math.random() * 9));
	};

	customers_coll.update({fb_id:fb_id},{$set:{tmp_phone:phone,twilio_token:token,country_code:country_code}},function(err,upd){
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
	debug.log(fb_id)
	debug.log(token)
	
	customers_coll.findOne({fb_id:fb_id},function(err,r){
		if(err){
			res.json({code_error:503})
		}else{
			if(r != null){
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
			}else{
				debug.log('data null')
				res.json({code_error:403})
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

exports.list_countryCode = function(req,res){
	var countries        = require('country-data').countries,
    currencies       = require('country-data').currencies,
    regions          = require('country-data').regions,
    languages        = require('country-data').languages,
    callingCountries = require('country-data').callingCountries;
	
	var dt = [];
	var n = 0;
	
	async.forEachOf(countries.all,function(v,k,e){
		dt[k] = new Object();
		dt[k].alpha2 = v.alpha2
		dt[k].alpha3 = v.alpha3
		dt[k].countryCallingCodes = v.countryCallingCodes[0]
		dt[k].currencies = v.currencies[0]
		dt[k].ioc = v.ioc
		dt[k].languages = v.languages[0]
		dt[k].name = v.name
		dt[k].status = v.status
	})
	
	res.json(dt)
}

exports.parseCountryCode = function(req,res){
	var countries        = require('country-data').countries,
    currencies       = require('country-data').currencies,
    regions          = require('country-data').regions,
    languages        = require('country-data').languages,
    callingCountries = require('country-data').callingCountries;
	
	var sift = require('sift');
	
	customers_coll.find({}).toArray(function(err,r){
		var tmp_phone = [];
		var arr_fbid = [];
		var n = 0;
		async.forEachOf(r,function(v,k,e){
			if(v.tmp_phone != '' && typeof v.tmp_phone != 'undefined' && v.tmp_phone != null){
				tmp_phone[n] = v.tmp_phone;
				arr_fbid[n] = v.fb_id
				n++;
			}
		})
		
		var country_code = []
		var m = 0
		
		async.forEachOf(countries.all,function(v,k,e){
			var str = String(v.countryCallingCodes[0])
			var cc = str.replace('+','');
			async.forEachOf(tmp_phone,function(ve,ke,ee){
				if(cc != 'undefined' && typeof cc != 'undefined'){
					var phone_cc = sift({$regex:"^"+cc},[ve])
					if(phone_cc.length > 0){
						country_code[m] = {
							phone:phone_cc[0],
							country_code : cc,
							currencies : v.currencies[0],
							alpha2:v.alpha2,
							alpha3:v.alpha3,
							languages : v.languages[0],
							name:v.name,
							status:v.status,
							fb_id:arr_fbid[ke]
						}
						m++;
					}
				}
			})
		})
		
		async.forEachOf(country_code,function(v,k,e){
			var cond = {
				fb_id:v.fb_id
			}
			var form_upd = {
				$set:{country_code:v}
			}
			customers_coll.update(cond,form_upd,function(err,upd){
				if(!err){
					debug.log('updated '+v.fb_id)
				}
			})
		})
		
		res.json(country_code)
	})
	
}

exports.upload_profileimage = function(req,res){
	var post = req.body;
	
	var fb_id = post.fb_id;
	var url_img = post.url_img;
	var filename = post.filename;
	var mimetype = post.mimetype;
	var encoding = post.encoding;
	
	async.series([
		function push_cust(cb){
			var upd_form = {
				$push:{
					photos:url_img
				}
			}
			if(fb_id != ''){
				customers_coll.update({fb_id:fb_id},upd_form,function(err,r){
					if(err){
						debug.log(err)
					}
				})
			}
			cb(null,'next')
		},
		function insert_photo_temp(cb){
			var form_insert = {
				fb_id:fb_id,
				url_img:url_img,
				filename:filename,
				mimetype:mimetype,
				encoding:encoding,
				is_upload:false,
				created_at:new Date()
			}
			if(fb_id != ''){
				image_temp_coll.insert(form_insert,function(err,upd){
					if(err){
						debug.log(err)
					}
				})
			}
			cb(null,'next')
		}
	],function(err,merge){
		res.json({success:true})
	})
}

exports.remove_profileimage = function(req,res){
	var post = req.body;
	var fb_id = xssFilters.inHTMLData(req.body.fb_id);
	var url = xssFilters.uriInHTMLData(req.body.url);
	
	debug.log(fb_id)
	debug.log(url)
	
	var base_url = '';
	if(String(url.indexOf('?imgid=')) == String(-1)){
		base_url = url;
	}else{
		var ex_base_img = url.split('?imgid=');
		base_url = ex_base_img[1];
	}
	
	var exf = base_url.split('/');
	var filename = exf[exf.length-1];
	
	async.waterfall([
		function remove_photos(cb22){
			var cond = {
				fb_id:fb_id,
				photos:base_url
			}
			var form_upd = {
				$pull:{photos:base_url}
			}
			customers_coll.update(cond,form_upd,function(err,upd){
				if(err){
					debug.log(err)
					debug.log('error line 457 membersettings')
					cb22(null,false)
				}else{
					cb22(null,true)
				}
			})
		}
	],function(err,merge){
		if(merge == true){
			res.json({success:true})
		}else{
			res.json({code_error:403})
		}
	})
	
	
}

exports.save_longlat = function(req,res){
	var post = req.body;
	var longitude = parseFloat(post.longitude);
	var latitude = parseFloat(post.latitude);
	var fb_id = post.fb_id;
	
	var cond = {
		fb_id:fb_id
	}
	var upd_form = {
		$set:{
			position:{
				type:'Point',
				coordinates:[longitude,latitude]
			}
		}
	}
	customers_coll.update(cond,upd_form,function(err,upd){
		if(err){
			debug.log(err);
			debug.log('error line 369 login savelanglot')
			res.json({code_error:403})
		}else{
			res.json({success:true})
		}
	})
}