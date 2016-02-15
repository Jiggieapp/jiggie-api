require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var Mixpanel = require('mixpanel');
var mixpanel = Mixpanel.init('39ae6be779ffea77ea2b2a898305f560');


exports.index = function(req, res){
	req.app.get("helpers").logging("request","get","",req);
	
	var fb_id = req.params.fb_id;
	var member_fb_id = req.params.member_fb_id;
	
	customers_coll.find({fb_id:{$in:[fb_id,member_fb_id]}}).toArray(function(ers,cekmem){
		if(cekmem.length != 2){
			// 403 => Invalid ID
			res.json({code_error:403})
		}else{
			async_conv(req,fb_id,member_fb_id,function(data){
				res.json(data[0]);
			});
		}
	})
	
};

function async_conv(req,fb_id,member_fb_id,next){
	async.parallel([
		function get_data_conv(cb){
			get_conv(req,fb_id,member_fb_id,function(json){
				cb(null,json);
			});
		},
		function upd_unread(cb){
			var cond = {
				fb_id:fb_id,
				"conversations.fb_id":member_fb_id
			}
			var upd_form = {
				$set:{"conversations.$.unread":0}
			}
			chatmessages_coll.update(cond,upd_form,function(){});
			cb(null,'next')
		}
	],function(err,merge){
		next(merge);
	})
}

function get_conv(req,fb_id,member_fb_id,next){
	async.waterfall([
		function getchat(cb){
			chatmessages_coll.findOne({fb_id:fb_id},function(err,rows){
				if(err){
					req.app.get("helpers").logging("error","get","conversations.js line 23 "+String(err),req);
					debug.log(err);
				}else{
					var conv = new Object();
					async.forEachOf(rows.conversations,function(v,k,e){
						if(v.fb_id == member_fb_id){
							conv = v;
						}
					});
					cb(null,conv);
				}
			})
		},
		function get_conv(conv,cb){
			var json_data = new Object();
			json_data.fromId = conv.fromId;
			json_data.fromName = conv.fromName;
			json_data.profile_image = conv.profile_image;
			json_data.messages = [];
			json_data.messages = conv.messages;
			json_data.last_message = conv.last_message;
			json_data.last_updated = conv.last_updated;
			json_data.unread = parseInt(conv.unread);
			json_data.fb_id = conv.fb_id;
			json_data.hasreplied = conv.hasreplied;
			
			cb(null,json_data);
			
		}
	],function(err,json){
		if(err){
			debug.log(err);
		}else{
			next(json);
		}
		
	})
}



exports.post_message = function(req,res){
	doall_message(req,function(state){
		res.json({
			success:true,
			chat_state:state
		})
	})
}

function doall_message(req,next){
	async.waterfall([
		function posting(cb){
			post_message(req,function(){
				cb(null,"next");
			});
		},
		function response(dt,cb){
			response_message(req,function(state){
				cb(null,state);
			})
		},
		function do_mixpxanel(state,cb){
			async_mixpanel(req,state,function(){
				
			})
		}
	],function(err,state){
		next(state);
	})
}

// mixpanel //

function async_mixpanel(req,state,next){
	var post = req.body;
	var fromId = post.fromId;
	var toId = post.toId;
	var event_data = {"state":state}
	async.parallel([
		function trackEvent_fromid(cb){
			trackEvent_mixpanel("Conversation Updated",from_id,event_data)
			cb(null,'next')
		},
		function incrementItem(cb){
			incrementItem_mixpanel(from_id,'chat_count');
			incrementItem_mixpanel(toId,'chat_count');
			cb(null,'next');
		},
		function trackEvent_toid(cb){
			trackEvent_mixpanel("Conversation Updated",toId,event_data)
			cb(null,'next')
		}
	],function(err,merge){
		next('next');
	})
}

function trackEvent_mixpanel(event_name,fb_id,dict){
	dict.distinct_id = fb_id;
	customers_coll.findOne({fb_id:fb_id},function(err,rows){
		var data = rows.mixpanel;
		if(data != undefined){
			for (var i = 0; i < Object.keys(data).length; i++){
				dict[Object.keys(data)[i]] = data[Object.keys(data)[i]];
			}
			// debug.log(dict);
			mixpanel.track(event_name,dict,function(err){
				if(err){debug.log(err);}
			});
		}
	});
	return true;
}

function incrementItem_mixpanel(fb_id,item_name){
	mixpanel.people.increment(fb_id, item_name,function(err){
		if(err){debug.log(err);}
	});
	return true;
}

// mixpanel //

function response_message(req,next){
	var post = req.body;
	var fromId = post.fromId;
	var toId = post.toId;
	
	async.waterfall([
		function chat_state(cb){
			var state = "";
			chatmessages_coll.findOne({fb_id:fromId},function(err,rows){
				var msg = [];
				async.forEachOf(rows.conversations,function(v,k,e){
					if(v.fb_id == toId){
						msg = v.messages;
					}
				});
				
				var is_fromyou = 0;
				var is_fromother = 0;
				async.forEachOf(msg,function(v,k,e){
					if(v.isFromYou == true){
						is_fromyou++;
					}
					if(v.isFromYou == false){
						is_fromother++;
					}
				})
				
				if(is_fromother == 0 && is_fromyou == 1){
					state = "NON_ACTIVATED_CHAT_INITIATED";
				}else if(is_fromother == 0 && is_fromyou > 1){
					state = "NON_ACTIVATED_CHAT_UPDATED";
				}else if(is_fromother == 1 && is_fromyou == 1){
					state = "ACTIVATED_CHAT_INITIATED";
				}else if(is_fromother == 1 && is_fromyou > 1){
					state = "ACTIVATED_CHAT_INITIATED";
				}else if(is_fromother > 1 && is_fromyou > 1){
					state = "ACTIVATED_CHAT_UPDATED";
				}else if(is_fromother == 0 && is_fromyou == 0){
					state = "NON_ACTIVATED_CHAT_INITIATED";
				}
				cb(null,state);
			});
		}
	],function(err,state){
		next(state);
	})
}

function post_message(req,next){
	var post = req.body;
	var fromId = post.fromId;
	var header = post.header;
	var fromName = post.fromName;
	var message = post.message;
	var hosting_id = post.hosting_id;
	var key = post.key;
	var toId = post.toId;
	
	async.parallel([
		function self(cb){
			chatmessages_coll.findOne({fb_id:fromId},function(err,rows){
				
				var json_data = new Object();
				json_data.created_at = new Date();
				json_data.header = header;
				json_data.message = message;
				json_data.isFromYou = true;
				
				
				var cond = {
					_id : new ObjectId(rows._id),
					"conversations.fb_id":toId
				}
				var upd_data = {
					$push:{"conversations.$.messages":json_data},
					$set:{
						"conversations.$.last_message":message,
						"conversations.$.last_updated":new Date(),
						"conversations.$.hasreplied":false
					}
				}
				chatmessages_coll.update(cond,upd_data,function(err,upd){
					if(err){
						debug.log(err);
						req.app.get("helpers").logging("error","get","conversations.js line 112 "+String(err),req);
					}
				})
				cb(null,"next");
			});
		},
		function other(cb){
			chatmessages_coll.findOne({fb_id:toId},function(err,rows){
				
				var json_data = new Object();
				json_data.created_at = new Date();
				json_data.header = header;
				json_data.message = message;
				json_data.isFromYou = false;
				
				// get unread //
				var now_unread = 0;
				async.forEachOf(rows.conversations,function(v,k,e){
					if(v.fb_id == fromId){
						now_unread = v.unread+1;
					}
				})
				// get unread //
				
				
				var cond = {
					_id : new ObjectId(rows._id),
					"conversations.fb_id":fromId
				}
				var upd_data = {
					$push:{"conversations.$.messages":json_data},
					$set:{
						"conversations.$.last_message":message,
						"conversations.$.last_updated":new Date(),
						"conversations.$.hasreplied":false,
						"conversations.$.delete":false,
						"conversations.$.unread":now_unread
					}
				}
				chatmessages_coll.update(cond,upd_data,function(err,upd){
					if(err){
						debug.log(err);
						req.app.get("helpers").logging("error","get","conversations.js line 139 "+String(err),req);
					}
				})
				cb(null,"next");
			});
		},
		function push_notif(cb){
			customers_coll.findOne({fb_id:fromId},function(errs,rw){
				var json_form = {
					fb_id :toId,
					fromId:fromId,
					message : rw.first_name+':'+message,
					route : 'chat'
				}
				var options = {
					url:'http://127.0.0.1:16523/apn',
					form:json_form,
				}
				request.post(options,function(err,resp,body){
					debug.log(err);
					debug.log(resp);
					debug.log(body);
				})
				cb(null,'next');
			})
		}
	],function(err,upd){
		next(upd);
	})
}