require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var path = require('path');
var util = require("util");
var apn = require('apn');
var gcm = require('node-gcm');

var optionsLive = {
   cert : path.join(__dirname, 'livecerts') + "/PushChatLiveCert.pem",
   key : path.join(__dirname, 'livecerts') + "/PushChatLiveKey.pem",
   passphrase:"manhattan",
   production :true,
   debug:true
};

var connection = new apn.Connection(optionsLive);
notification = new apn.Notification();

// START : APN //
exports.apn = function(req,res){
	function extend(target) {
		var sources = [].slice.call(arguments, 1);
		sources.forEach(function (source) {
			for (var prop in source) {
				target[prop] = source[prop];
			}
		});
		return target;
	}
	
	var post = req.body;
	debug.log(post);
	
	var message = post.message;
	var lim_msg = message.trunc(144,true);
	var post_type = post.type;
	
	customers_coll.find({}).toArray(function(err,rows){
		var _ = require('underscore');
		
		var data_filter_apn = _.uniq(rows, function(item, key, apn_token) { 
			return item.apn_token;
		});
		
		var data_filter_gcm = _.uniq(rows, function(item, key, gcm_token) { 
			return item.gcm_token;
		});
		
		
		
		var howtot_ios = 0;
		var howtot_and = 0;
		var alert = lim_msg;
		try{
			async.parallel([
				function push_gcm(cb){
					async.forEachOf(data_filter_gcm,function(ve,ke,ee){
						if(typeof ve.gcm_token != 'undefined'){
							debug.log('GCM Token :'+ve.gcm_token)
							debug.log('FBID :'+ve.fb_id)
							var gcm_token = '';
							(ve.gcm_token == null) ? gcm_token = '' : gcm_token = ve.gcm_token;
							if(checkIfAndroid(gcm_token) == true){
								gcm_token = gcm_token
							}else{
								gcm_token = '';
							}
							
							if(gcm_token != '' && gcm_token != 'empty' && gcm_token != 'undefined'){
								sendGPN(post,ve.fb_id,'',alert,gcm_token,post_type);
								howtot_and++;
							}else{
								debug.log('GCM Token Empty')
							}
						}else{
							debug.log('GCM Token undefined')
						}
					})
					cb(null,'next');
				},
				function push_apn(cb){
					async.forEachOf(data_filter_apn,function(ve,ke,ee){
						debug.log('APN Token :'+ve.apn_token)
						debug.log('FBID :'+ve.fb_id)
						var token = '';
						(ve.apn_token == null) ? token = '' : token = ve.apn_token;
						if(checkIfAndroid(token) == false){
							token = token
						}else{
							token = '';
						}
						
						if(typeof token != 'undefined' && token != 'empty'  && token != '' && token != 'undefined'){
							var payload = new Object();
							if(post_type == 'general'){
								payload.type = 'general';
							}else if(post_type == 'event'){
								payload.type = "event";
								payload.event_id = post.event_id;
							}else{
								payload.type = 'general';
							}
							
							payload.message = message;
							payload.hosting_id = "";
							payload.badge = 1;

							
							notification.device = new apn.Device(token);
							notification.alert = alert;
							notification.payload = payload;
							notification.badge = 1;
							notification.sound = "default";
							connection.sendNotification(notification);
							howtot_ios++;
							debug.log('IOS TOKEN USING');
						}else{
							debug.log('APN token empty');
						}
					})
					cb(null,'next');
				}
			],function(err,ush){
				debug.log(ush)
			})
		}catch(e){
			debug.log(e);
		}
		debug.log('TOTAL USING ANDROID '+howtot_and);
		debug.log('TOTAL USING IOS '+howtot_ios);
	});
	
	res.send("APN_SENT!!");
}

function onErrorCB(err,obj){
	console.log(err);
	console.log("ERROR_APN")
	console.log(util.inspect(err),util.inspect(obj))
}

String.prototype.trunc =
function( n, useWordBoundary ){
	var isTooLong = this.length > n,
	s_ = isTooLong ? this.substr(0,n-1) : this;
	s_ = (useWordBoundary && isTooLong) ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
	return  isTooLong ? s_ + '&hellip;' : s_;
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// END : APN //

// START : GCM //

function sendGPN(post,fb_id,fromId,messageToAdd,token,post_type){
	var API_KEY = 'AIzaSyC9UPTbE_uPBmexhmB-g6IyB403nGbiBeI';
	var message = new gcm.Message();
	
	if(post_type == 'general'){
		message.addData('type', 'general');
		message.addData('Jiggie', messageToAdd);
	}else if(post_type == 'event'){
		message.addData('type', 'event');
		message.addData('Jiggie', messageToAdd);
		message.addData('event_id', post.event_id);
	}else{
		message.addData('type', 'general');
		message.addData('Jiggie', messageToAdd);
	}
	
	var regTokens = [token];
	var sender = new gcm.Sender(API_KEY);
	sender.send(message, { registrationTokens: regTokens }, function (err, result){
		if(err){
			debug.log("fail_android_push")
			debug.log(err);
		}else{
			// debug.log("success_android_push")
			// debug.log(result)
		};
	});
	
}


function checkIfAndroid(token)
{
	if(token != String(token).toLowerCase())
	{
		return true;
	}

	if(String(token).indexOf(":") != -1)
	{
		return true;
	}

	return false;
}
// END : GCM //