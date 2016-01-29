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
   // ca : path.join(__dirname, 'livecerts') + "/cklive.pem",
   // key : path.join(__dirname, 'dev_certs') + "/PushChatKey.pem",
   // cert : path.join(__dirname, 'dev_certs') + "/PushChatCert.pem",
   // key : path.join(__dirname, 'dev_dev_certs') + "/PushChatKey.pem",
   // cert : path.join(__dirname, 'dev_dev_certs') + "/PushChatCert.pem",
   // key : path.join(__dirname, 'new_certs/dev') + "/PushChatDevKey.pem",
   // cert : path.join(__dirname, 'new_certs/dev') + "/ckdev.pem",
   // key : path.join(__dirname, 'new_certs') + "/PushChatLiveKey.pem",
   // cert : path.join(__dirname, 'new_certs') + "/cklive.pem",
   // key : path.join(__dirname, 'certs') + "/PushChatLiveKey.pem",
   // cert : path.join(__dirname, 'certs') + "/cklive.pem",
   passphrase:"manhattan",
   production :true,
   // gateway:"gateway.sandbox.push.apple.com",
   debug:true,
   // errorCallback:onErrorCB
};

exports.apn = function(req,res){
	var post = req.body;
	
	var fb_id = post.fb_id;
	var message = post.message;
	var lim_msg = message.trunc(50,true);
	var route = post.route;
	
	customers_coll.findOne({fb_id:fb_id},function(err,r){
		var token = r.apn_token
		var alert = lim_msg;
		// if(route == 'social'){
			// alert = lim_msg;
		// }else if(route == 'chat'){
			// alert = r.first_name+' '+r.last_name+' : '+lim_msg;
		// }else{
			// alert = lim_msg;
		// }
		
		if(checkIfAndroid(token) == true){
			debug.log('ANDROID TOKEN USING');
			sendGPN(alert,token);
		}else{
			debug.log('IOS TOKEN USING');
			var fromId = fb_id;
			var fromFBId = fb_id;
			var fromName = r.first_name+' '+r.last_name;
			
			
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
			// notification.device = new apn.Device("88bc6dcb277a2a1d4709f0b921c42bd144221af36a1acd8da60fd2f4426483f7");
			notification.device = new apn.Device(token);
			notification.alert = alert;
			notification.payload = payload;
			notification.badge = 1;
			notification.sound = "default";
			connection.sendNotification(notification);
		}
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

function sendGPN(messageToAdd,token){
	// example token agga
	// eqnRKBHQk7E:APA91bErfoh7unz94_NKM5HgMIz3jKiRvYS12w6HktEymm5kw6DdywcycVIYHV246Ge35d-tgN0D0BKrQzc2EOOFXOpNFTMnofMx0i5uwV4X_B2F1MsWPRVsSkDeQ0uWlrhGHLQri21x
	
	
	var API_KEY = 'AIzaSyBKCeyNfIEEas5pzOckT7fcCmz_8iQnJW0';
	var message = new gcm.Message();
	message.addData('Jiggie', messageToAdd);
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