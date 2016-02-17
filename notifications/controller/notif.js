require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var path = require('path');
var util = require("util");
var apn = require('apn');
var gcm = require('node-gcm');


// START : APN //
var optionsLive = {
   cert : path.join(__dirname, 'livecerts') + "/PushChatLiveCert.pem",
   key : path.join(__dirname, 'livecerts') + "/PushChatLiveKey.pem",
   passphrase:"manhattan",
   production :true,
   debug:true
};

exports.apn = function(req,res){
	var post = req.body;
	debug.log(post);
	
	var fb_id = post.fb_id;
	var message = post.message;
	var lim_msg = message.trunc(50,true);
	var route = post.route;
	var fromIdData = post.fromId;
	
	customers_coll.findOne({fb_id:fb_id},function(err,r){
		membersettings_coll.findOne({fb_id:fb_id},function(errmem,memr){
			var permit = 0;
			if(memr != null){
				if(route == 'chat'){
					if(memr.notifications.chat == true){
						permit = 1;
					}else{
						permit = 0;
					}
				}else if(route == 'social'){
					if(memr.notifications.feed == true){
						permit = 1;
					}else{
						permit = 0;
					}
				}
			}else{
				permit = 0;
			}
			
			if(permit == 1){
				var alert = lim_msg;
			
				var token = '';
				(r.apn_token == null) ? token = '' : token = r.apn_token;
				if(checkIfAndroid(token) == false){
					token = token
				}else{
					token = '';
				}
				
				var gcm_token = '';
				(r.gcm_token == null) ? gcm_token = '' : gcm_token = r.gcm_token;
				if(checkIfAndroid(gcm_token) == true){
					gcm_token = gcm_token
				}else{
					gcm_token = '';
				}
				
				debug.log('APN Token :'+token)
				debug.log('GCM Token :'+gcm_token)
				debug.log('FBID :'+fb_id)
				
				async.parallel([
					function push_gcm(cb){
						if(typeof gcm_token != 'undefined'){
							if(gcm_token != '' && gcm_token != 'empty' && gcm_token != 'undefined'){
								sendGPN(fb_id,fromIdData,alert,gcm_token);
							}else{
								debug.log('GCM Token Empty')
							}
						}else{
							debug.log('GCM Token undefined')
						}
						cb(null,'next');
					},
					function push_apn(cb){
						if(typeof token != 'undefined' && token != 'empty'  && token != '' && token != 'undefined'){
							var fromId = fromIdData;
							var fromFBId = fromIdData;
							
							customers_coll.findOne({fb_id:fromId},function(err2,r2){
								var fromName = r2.first_name;
								var payload = new Object();
								payload.type = "message";
								payload.fromId = fromId;
								payload.fromFBId = fromFBId;
								payload.fromName = fromName;
								payload.message = message;
								payload.hosting_id = "";
								payload.badge = 1;

								var connection = new apn.Connection(optionsLive);
								notification = new apn.Notification();
								notification.device = new apn.Device(token);
								notification.alert = alert;
								notification.payload = payload;
								notification.badge = 1;
								notification.sound = "default";
								connection.sendNotification(notification);
								debug.log('IOS TOKEN USING');
							})
							
						}else{
							debug.log('APN token empty');
						}
						cb(null,'next');
					}
				],function(err,ush){
					debug.log(ush)
				})
			}else{
				debug.log('Not Permited');
			}
		})
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

function sendGPN(fb_id,fromId,messageToAdd,token){
	// example token aggas
	// eqnRKBHQk7E:APA91bErfoh7unz94_NKM5HgMIz3jKiRvYS12w6HktEymm5kw6DdywcycVIYHV246Ge35d-tgN0D0BKrQzc2EOOFXOpNFTMnofMx0i5uwV4X_B2F1MsWPRVsSkDeQ0uWlrhGHLQri21x
	
	// var API_KEY = 'AIzaSyBKCeyNfIEEas5pzOckT7fcCmz_8iQnJW0';
	var API_KEY = 'AIzaSyC9UPTbE_uPBmexhmB-g6IyB403nGbiBeI';
	var message = new gcm.Message();
	message.addData('Jiggie', messageToAdd);
	message.addData('fromId', fromId);
	message.addData('toId', fb_id);
	var regTokens = [token];
	var sender = new gcm.Sender(API_KEY);
	sender.send(message, { registrationTokens: regTokens }, function (err, result){
		if(err){
			debug.log("fail_android_push")
			debug.log(err);
		}else{
			debug.log("success_android_push")
			debug.log(result)
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