require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var path = require('path');
var util = require("util");
var Mixpanel = require('mixpanel');
var mixpanel = Mixpanel.init('39ae6be779ffea77ea2b2a898305f560');


exports.index = function(req, res){
	req.app.get("helpers").logging("request","get","",req);
	
	var fb_id = req.params.fb_id;
	var gender_interest = req.params.gender_interest;
	
	customers_coll.findOne({fb_id:fb_id},function(errs,cek_fbid){
		if(cek_fbid == undefined){
			// 403 => Invalid ID
			res.json({code_error:403})
		}else if(['male','female','both'].indexOf(gender_interest) == -1){
			// 403 => Invalid ID
			res.json({code_error:403})
		}else{
			get_data(req,fb_id,gender_interest,function(data){
				if(data.length == 0){
					res.json({code_error:204})
				}else{
					res.json(data);
				}
			})
		}
	})	
	
	
};

function get_data(req,fb_id,gender_interest,next){
	async.waterfall([
		function get_socialfeed(callback){
			socialfeed_coll.findOne({fb_id:fb_id},function(err,rows){
				if(err){
					// debug.log(err);
				}else{
					if(rows != null){
						if(rows.users != null){
							callback(null,rows.users);
						}else{
							callback(null,[]);
						}
					}else{
						callback(null,[]);
					}
					
				}
			})
		},
		function get_matche(socfed_users,callback){
			if(socfed_users.length > 0){
				var in_fbid = [];
				var n = 0;
				async.forEachOf(socfed_users,function(v,k,e){
					in_fbid[n] = v.fb_id;
					n++;
				})
				
				var cond_cust = {
					fb_id:{$in:in_fbid}
				}
				customers_coll.find(cond_cust).toArray(function(err,rows){
					callback(null,socfed_users,rows);
				})
			}else{
				callback(null,[],[]);
			}
		},
		function show_data(socfed_users,rows_cust,callback){
			if(socfed_users.length > 0){
				async.forEachOf(rows_cust,function(v,k,e){
					async.forEachOf(socfed_users,function(v2,k2,e2){
						if(v.fb_id == v2.fb_id){
							if(v.matchme == undefined || v.matchme == true){
								socfed_users[k2].matchme = true;
							}else{
								socfed_users[k2].matchme = false;
							}
						}
					})
				})
				
				var cek = 0;
				async.forEachOf(socfed_users,function(v,k,e){
					if(v.from_state == 'viewed' && v.fb_id != fb_id){
						cek++;
					}
				})
				
				if(cek > 0){
					
					var json_data = [];
					var n = 0;
					async.forEachOf(socfed_users,function(v,k,e){
						if(v.matchme == true){
							if(v.fb_id != fb_id){
								if(v.from_state != 'denied' && v.to_state != 'denied'){
									if(v.from_state == "viewed"){
										json_data[n] = new Object();				
										if(gender_interest == "both"){
											json_data[n].fb_id = fb_id;
											json_data[n].from_fb_id = v.fb_id;
											json_data[n].from_first_name = v.first_name;
											json_data[n].event_id = v.event_id;
											json_data[n].event_name = v.event_name;
										
											if(v.to_state == "approved"){
												json_data[n].type = "approved";
												json_data[n].type_rank = 2;
											}else if(v.to_state == "viewed"){
												json_data[n].type = "viewed";
												json_data[n].type_rank = 1;
											}
											json_data[n].last_updated = v.last_viewed;
											n++;
										}else if(gender_interest == 'male'){
											if(v.gender == 'male'){
												json_data[n].fb_id = fb_id;
												json_data[n].from_fb_id = v.fb_id;
												json_data[n].from_first_name = v.first_name;
												json_data[n].event_id = v.event_id;
												json_data[n].event_name = v.event_name;
												
												
												if(v.to_state == "approved"){
													json_data[n].type = "approved";
													json_data[n].type_rank = 2;
												}else if(v.to_state == "viewed"){
													json_data[n].type = "viewed";
													json_data[n].type_rank = 1;
												}
												
												json_data[n].last_updated = v.last_viewed;
												n++;
											}
										}else if(gender_interest == 'female'){
											if(v.gender == 'female'){
												json_data[n].fb_id = fb_id;
												json_data[n].from_fb_id = v.fb_id;
												json_data[n].from_first_name = v.first_name;
												json_data[n].event_id = v.event_id;
												json_data[n].event_name = v.event_name;
												
												
												if(v.to_state == "approved"){
													json_data[n].type = "approved";
													json_data[n].type_rank = 2;
												}else if(v.to_state == "viewed"){
													json_data[n].type = "viewed";
													json_data[n].type_rank = 1;
												}
												
												json_data[n].last_updated = v.last_viewed;
												n++;
											}
										}
										
										
									}
								}
							}
						}
					});
					
					json_data = json_data.sort(sortDate);
					json_data = json_data.filter(function(n){
						return JSON.stringify(n) != '[{}]'
					})
					json_data = json_data.filter(function(n){
						return typeof n.fb_id != 'undefined';
					})
					
					if(json_data.length > 20){
						json_data.length = 20;
					}
					
					
					// debug.log(json_data);
					if(JSON.stringify(json_data) == '[{}]'){
						callback(null,[]);
					}else{
						callback(null,json_data);
					}
				}else{
					callback(null,[]);
				}
			}else{
				callback(null,[]);
			}
		}
	],function(err,merge){
		next(merge);
	})
}

// sort desc by last_updated Date
var sortDate = function (a, b){
	if(a.type_rank < b.type_rank) return 1;
	if(a.type_rank > b.type_rank) return -1;
	
	
	if(a.last_updated == undefined)
	{
		a.last_updated = new Date(2000,0,1);
	}
	if(b.last_updated == undefined)
	{
		b.last_updated = new Date(2000,0,1);
	}
	if (a.last_updated < b.last_updated) return 1;
	if (a.last_updated > b.last_updated) return -1;
	
	return 0;
}



exports.connect = function(req,res){
	req.app.get("helpers").logging("request","get","",req);
	
	var fb_id = req.params.fb_id;
	var member_fb_id = req.params.member_fb_id;
	var match = req.params.match;
	
	do_connect_n_updchat(req,fb_id,member_fb_id,match,function(upd){
		req.app.get("helpers").logging("response","get","{success:true}",req);
		res.json({success:true});
	})
	
}

function do_connect_n_updchat(req,fb_id,member_fb_id,match,next){
	async.waterfall([
		function connecting(cb){
			connect(req,fb_id,member_fb_id,match,function(upd){
				cb(null,1);
			})
		},
		function cek_isMatch(cekcon,cb){
			if(cekcon == 1){
				socialfeed_coll.findOne({fb_id:fb_id},function(err,rows){
					var cek = "";
					async.forEachOf(rows.users,function(v,k,e){
						if(v.fb_id == member_fb_id){
							if(v.from_state == "approved" && v.to_state == "approved"){
								cek = 1;
							}else{
								cek = 0;
							}
						}
					});
					cb(null,cek);
				});
			}else{
				req.app.get("helpers").logging("error","get","Function Error On First Function do_connect_n_updchat.connecting",req);
				cb(null,"err")
			}
		},
		function updating_chat(cek_isMatch,cb){
			if(cek_isMatch == 1){
				var ddcond = {
					fb_id:fb_id,
					"conversations.fb_id":member_fb_id
				}
				chatmessages_coll.findOne(ddcond,function(errs,cek_is_exist){
					if(cek_is_exist == undefined){
						update_chat(req,fb_id,member_fb_id,function(upd){})
					}
				})
				
				cb(null,cek_isMatch);
			}else{
				cb(null,0);
			}
		},
		function do_mixpanel(cek_isMatch2,cb){
			if(cek_isMatch2 == 1){
				do_mixpanel_async(fb_id,member_fb_id,function(dt){
					cb(null,cek_isMatch2);
				});
			}else if(cek_isMatch2 == 0){
				cb(null,cek_isMatch2);
			}
		},
		function push_notif(cek_match,cb){
			if(cek_match == 1){
				customers_coll.findOne({fb_id:fb_id},function(err,r){
					var json_form = {
						fb_id :member_fb_id,
						message : 'You are now matched with '+r.first_name.capitalizeFirstLetter(),
						fromId : fb_id,
						route: 'social'
					}
					var options = {
						url:'http://127.0.0.1:16523/apn',
						form:json_form
					}
					request.post(options,function(err,resp,body){
						if(err){
							// debug.log(err)
						}else{
							// debug.log('apn sent');
						}
					})
				})
			}
			cb(null,cek_match);
		},
		function clean_data(cek_match,cb){
			cleaning_data(fb_id,member_fb_id,function(upd){
				debug.log(upd);
			})
			
			cb(null,"next")
		}
	],function(err,merge){
		next(merge);
	})
}

function cleaning_data(fb_id,member_fb_id,next){
	async.parallel([
		function self(cb){
			var cond = {
				fb_id:fb_id,
				"conversations.fb_id":member_fb_id
			}
			chatmessages_coll.findOne(cond,function(err,r){
				if(err){
					debug.log(err);
				}else{
					if(r != null){
						var cek = 0;
						var data_to_push = new Object();
						async.forEachOf(r.conversations,function(v,k,e){
							if(v.fb_id == member_fb_id){
								cek++;
								data_to_push = v;
							}
						})
						if(cek > 1){
							var condd = {
								fb_id:fb_id,
								"conversations.fb_id":member_fb_id
							}
							async.waterfall([
								function upd1(cb){
									var upd_form = {
										$pull:{conversations:{fb_id:member_fb_id}}
									}
									chatmessages_coll.update(condd,upd_form,{w:1,multi:false},function(err,upd){
										if(err){
											debug.log('asdasd 2');
											debug.log(err);
											cb(null,0)
										}else{
											debug.log('jalan')
											cb(null,1);
										}
									})
								},
								function upd2(dt,cb){
									if(dt == 1){
										var cond2 = {
											_id:new ObjectId(r._id)
										}
										var upd_push = {
											$push:{conversations:data_to_push}
										}
										chatmessages_coll.update(cond2,upd_push,function(err,upd){
											if(err){debug.log(err)}else{
												debug.log("jalanin push baru")
											}
										})
									}
									cb(null,1);
								}
							],function(err,mgg){
								debug.log(mgg)
							})
						}
					}else{
						debug.log("gk ada");
					}
				}
			})
			cb(null,'next')
		},
		function other(cb){
			var cond = {
				fb_id:member_fb_id,
				"conversations.fb_id":fb_id
			}
			chatmessages_coll.findOne(cond,function(err,r){
				if(err){
					debug.log(err);
				}else{
					if(r != null){
						var cek = 0;
						var data_to_push = new Object();
						async.forEachOf(r.conversations,function(v,k,e){
							if(v.fb_id == fb_id){
								cek++;
								data_to_push = v;
							}
						})
						if(cek > 1){
							var condd = {
								fb_id:member_fb_id,
								"conversations.fb_id":fb_id
							}
							async.waterfall([
								function upd1(cb){
									var upd_form = {
										$pull:{conversations:{fb_id:fb_id}}
									}
									chatmessages_coll.update(condd,upd_form,{w:1,multi:false},function(err,upd){
										if(err){
											debug.log('asdasd 2');
											debug.log(err);
											cb(null,0)
										}else{
											debug.log('jalan')
											cb(null,1);
										}
									})
								},
								function upd2(dt,cb){
									if(dt == 1){
										var cond2 = {
											_id:new ObjectId(r._id)
										}
										var upd_push = {
											$push:{conversations:data_to_push}
										}
										chatmessages_coll.update(cond2,upd_push,function(err,upd){
											if(err){debug.log(err)}else{
												debug.log("jalanin push baru")
											}
										})
									}
									cb(null,1);
								}
							],function(err,mgg){
								debug.log(mgg)
							})
						}
					}else{
						debug.log("gk ada");
					}
				}
			})
			cb(null,'next')
		}
	],function(err,merge){
		next(merge);
	})
}

function update_chat(req,fb_id,member_fb_id,next){
	async.parallel([
		function upd_self(cb){
			var json_data = new Object();
			var data_conv = new Object();
			
			chatmessages_coll.find({fb_id:fb_id}).toArray(function(err,rows){
				if(rows.length > 0){
					customers_coll.findOne({fb_id:member_fb_id},function(err2,rows2){
						data_conv.fromId = "";
						data_conv.fromName = rows2.first_name;
						data_conv.profile_image = rows2.profile_image_url;
						data_conv.messages = [];
						data_conv.last_message = "";
						data_conv.last_updated = new Date();
						data_conv.unread = 1;
						data_conv.hasreplied = false;
						data_conv.fb_id = member_fb_id;
						
						chatmessages_coll.update(
							{_id:new ObjectId(rows[0]._id)},
							{$push:{conversations:data_conv}},
						function(err,upd){
							if(err){
								debug.log(err);
								req.app.get("helpers").logging("error","get","Function Error Line 174 "+String(err),req);
							}else{
								// debug.log(upd);
							}
						})
					})
				}else{
					customers_coll.findOne({fb_id:member_fb_id},function(err2,rows2){
						json_data.userId = fb_id;
							data_conv.fromId = "";
							data_conv.fromName = rows2.first_name;
							data_conv.profile_image = rows2.profile_image_url;
							data_conv.messages = [];
							data_conv.last_message = "";
							data_conv.last_updated = new Date();
							data_conv.unread = 1;
							data_conv.hasreplied = false;
							data_conv.fb_id = member_fb_id;
						
						json_data.conversations = [];
						json_data.conversations[0] = data_conv;
						json_data.blocked = false;
						json_data.fb_id = fb_id;
						json_data.last_updated = new Date();
						
						chatmessages_coll.insert(json_data,function(err,ins){
							if(err){
								debug.log(err);
								req.app.get("helpers").logging("error","get","Function Error Line 182 "+String(err),req);
							}
						})
					});
				}
			})
			cb(null,"next");
		},
		function upd_other(cb){
			var json_data = new Object();
			var data_conv = new Object();
			
			chatmessages_coll.find({fb_id:member_fb_id}).toArray(function(err,rows){
				if(rows.length > 0){
					customers_coll.findOne({fb_id:fb_id},function(err2,rows2){
						data_conv.fromId = "";
						data_conv.fromName = rows2.first_name;
						data_conv.profile_image = rows2.profile_image_url;
						data_conv.messages = [];
						data_conv.last_message = "";
						data_conv.last_updated = new Date();
						data_conv.unread = 1;
						data_conv.hasreplied = false;
						data_conv.fb_id = fb_id;
						
						chatmessages_coll.update(
							{_id:new ObjectId(rows[0]._id)},
							{$push:{conversations:data_conv}},
						function(err,upd){
							if(err){
								debug.log(err);
								req.app.get("helpers").logging("error","get","Function Error Line 227 "+String(err),req);
							}
						})
					})
				}else{
					customers_coll.findOne({fb_id:fb_id},function(err2,rows2){
						json_data.userId = member_fb_id;
							data_conv.fromId = "";
							data_conv.fromName = rows2.first_name;
							data_conv.profile_image = rows2.profile_image_url;
							data_conv.messages = [];
							data_conv.last_message = "";
							data_conv.last_updated = new Date();
							data_conv.unread = 1;
							data_conv.hasreplied = false;
							data_conv.fb_id = fb_id;
						
						json_data.conversations = [];
						json_data.conversations[0] = data_conv;
						json_data.blocked = false;
						json_data.fb_id = member_fb_id;
						json_data.last_updated = new Date();
						
						chatmessages_coll.insert(json_data,function(err,ins){
							if(err){
								debug.log(err);
								req.app.get("helpers").logging("error","get","Function Error Line 252 "+String(err),req);
							}
						})
					});
				}
			})
			cb(null,"next");
		}
	],function(err,merge){
		next(merge);
	})
}

function connect(req,fb_id,member_fb_id,match,next){
	async.parallel([
		function upd_self(cb){
			var cond = {
				fb_id:fb_id,
				"users.fb_id":member_fb_id
			}
			var form = {
				$set:{"users.$.from_state":match}
			}
			socialfeed_coll.update(cond,form,function(err,upd){
				if(err){
					debug.log(err);
					req.app.get("helpers").logging("error","get","ERROR CONNECT SOCIAL MODULE "+String(err),req);
				}else{
					cb(null,"next");
				}
			})
		},
		function upd_other(cb){
			var cond = {
				fb_id:member_fb_id,
				"users.fb_id":fb_id
			}
			var form = {
				$set:{"users.$.to_state":match}
			}
			socialfeed_coll.update(cond,form,function(err,upd){
				if(err){
					debug.log(err);
					req.app.get("helpers").logging("error","get","ERROR CONNECT SOCIAL MODULE "+String(err),req);
				}else{
					cb(null,"next");
				}
			})
		}
	],function(err,upd){
		next(upd);
	})
}


// Start : MIXPANEL //
function do_mixpanel_async(from_id,to_id,next){
	async.waterfall([
		function get_socfed(cb){
			var event_id = "";
			socialfeed_coll.findOne({fb_id:from_id},function(err,rows){
				async.forEachOf(rows.users,function(v,k,e){
					if(v.fb_id == to_id){
						event_id = v.event_id;
					}
				});
				cb(null,event_id);
			})
		},
		function get_eventdetail22(event_id,cb){
			if(event_id != ""){
				var cond = {_id:new ObjectId(event_id)}
				events_detail_coll.findOne(cond,function(err,event_item){
					if(event_item != null){
						var data = new Object();
						data["Event Id"] = event_item._id;
						data["Event Name"] = event_item.title;
						data["Event Start Time"] = event_item.start_datetime;
						data["Event End Time"] = event_item.end_datetime;
						data["Event Description"] = event_item.description;
						data["Event Venue Name"] = event_item.venue_name;
					}else{
						var data = "";
					}
					cb(null,data);
				});
			}else{
				cb(null,"");
			}
		},
		function tracking(event_data,cb){
			if(event_data != ""){
				async_mixpanel(event_data,from_id,to_id,function(dt){
					// debug.log(dt);
				})
				cb(null,'next');
			}else{
				cb(null,'next');
			}
			
		}
	],function(err,merge){
		next('next');
	});
}

function async_mixpanel(event_data,from_id,to_id,next){
	async.parallel([
		function trackEvent_fromid(cb){
			event_data.match_order = 2;
			setTimeout(function(){
				trackEvent_mixpanel("User Match",from_id,to_id,event_data)
				debug.log('mix 1');
			},1000)
			cb(null,'next')
		},
		function incrementItem_fromId(cb){
			setTimeout(function(){
				incrementItem_mixpanel(from_id,'match_count');
			},2000);
			
			setTimeout(function(){
				incrementItem_mixpanel(from_id,'chat_count');
			},3000)
			cb(null,'next');
		},
		function trackEvent_toid(cb){
			event_data.match_order = 1;
			setTimeout(function(){
				trackEvent_mixpanel("User Match",to_id,from_id,event_data)
				debug.log('mix 2');
			},6000)
			cb(null,'next')
		},
		function incrementItem_toId(cb){
			setTimeout(function(){
				incrementItem_mixpanel(to_id,'match_count');
			},4000);
			
			setTimeout(function(){
				incrementItem_mixpanel(to_id,'match_count');
			},5000)
			cb(null,'next');
		}
	],function(err,merge){
		next('next');
	})
}

function trackEvent_mixpanel(event_name,distinct_id,fb_id,dict){
	dict.distinct_id = distinct_id;
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
// End : MIXPANEL //


exports.upd_matchme = function(req,res){
	var fb_id = req.params.fb_id;
	var matchme = req.params.matchme;
	if(matchme == 'no'){
		dt = false;
	}else if(matchme == 'yes'){
		dt = true;
	}
	
	customers_coll.update({fb_id:fb_id},{$set:{matchme:dt}},function(err,upd){
		if(err){
			debug.log(err)
		}else{
			res.json({success:true})
		}
	})
}

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}