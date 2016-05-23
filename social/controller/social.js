require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var path = require('path');
var util = require("util");
var Mixpanel = require('mixpanel');
var mixpanel = Mixpanel.init('39ae6be779ffea77ea2b2a898305f560');

var redis   = require("redis");
var client  = redis.createClient(6379,"jiggieappsredis.futsnq.0001.apse1.cache.amazonaws.com");

var geolib = require('geolib')

exports.index = function(req, res){
	var fb_id = req.params.fb_id;
	var gender_interest = req.params.gender_interest;
	
	async.waterfall([
		function get_socfed_data(cb){
			customers_coll.findOne({fb_id:fb_id},function(errs,cek_fbid){
				if(cek_fbid == undefined){
					// 403 => Invalid ID
					cb(null,false,{code_error:403})
				}else if(['male','female','both'].indexOf(gender_interest) == -1){
					// 403 => Invalid ID
					cb(null,false,{code_error:403})
				}else{
					get_data(req,fb_id,gender_interest,function(data){
						if(data.length == 0){
							cb(null,false,{code_error:204})
						}else{
							cb(null,true,data)
						}
					})
				}
			})
		},
		function nin_fbid(stat,dt_socfed,cb){
			if(stat == true){
				client.get("social_list_"+fb_id,function(err,val){
					if(val == null){
						cb(null,true,dt_socfed)
					}else{
						var nin_fbid = JSON.parse(val)
						
						async.forEachOf(dt_socfed,function(v,k,e){
							async.forEachOf(nin_fbid,function(ve,ke,ee){
								if(v.from_fb_id == ve){
									delete dt_socfed[k]
								}
							})
						})
						
						var dt_socfed2 = [];
						var n = 0;
						async.forEachOf(dt_socfed,function(v,k,e){
							if(v != null){
								dt_socfed2[n] = v;
								n++;
							}
						})
						
						cb(null,true,dt_socfed2)
					}
				})
			}else{
				cb(null,false,dt_socfed)
			}
		},
		function nin_fbid_last3(stat,dt_socfed,cb){
			if(stat == true){
				client.get("social_list_last3_"+fb_id,function(err,val){
					if(val == null){
						cb(null,true,dt_socfed)
					}else{
						if(dt_socfed.length > 3){
							var nin_fbid = JSON.parse(val)
								
							async.forEachOf(dt_socfed,function(v,k,e){
								async.forEachOf(nin_fbid,function(ve,ke,ee){
									if(v.from_fb_id == ve){
										delete dt_socfed[k]
									}
								})
							})
							
							var dt_socfed2 = [];
							var n = 0;
							async.forEachOf(dt_socfed,function(v,k,e){
								if(v != null){
									dt_socfed2[n] = v;
									n++;
								}
							})
							
							cb(null,true,dt_socfed2)
						}else{
							cb(null,true,dt_socfed)
						}
					}
				})
			}else{
				cb(null,false,dt_socfed)
			}
		}
	],function(err,stat,merge){
		res.json(merge)
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
		function get_cust_self(socfed_users,callback){
			customers_coll.findOne({fb_id:fb_id},function(err,r){
				callback(null,socfed_users,r);
			})
		},
		function get_matche(socfed_users,rows_self_users,callback){
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
					callback(null,socfed_users,rows,rows_self_users);
				})
			}else{
				callback(null,[],[],[]);
			}
		},
		function get_likesparse(socfed_users,rows_cust,rows_self_users,callback){
			get_likesdata(fb_id,function(likes_fbid){
				callback(null,socfed_users,rows_cust,likes_fbid,rows_self_users)
			})
		},
		function show_data(socfed_users,rows_cust,likes_fbid,rows_self_users,callback){
			var ppt = path.join(__dirname,"../../global/img.json");
			var pkg = require('fs-sync').readJSON(ppt);
			var imgurl = pkg.uri
			
			if(socfed_users.length > 0){
				async.forEachOf(rows_cust,function(v,k,e){
					async.forEachOf(socfed_users,function(v2,k2,e2){
						if(v.fb_id == v2.fb_id){
							if(v.matchme == undefined || v.matchme == true){
								socfed_users[k2].matchme = true;
								if(typeof rows_self_users.position != 'undefined' && typeof v.position != 'undefined'){
									socfed_users[k2].distance = geolib.getDistance(
										{latitude:rows_self_users.position.coordinates[1],longitude:rows_self_users.position.coordinates[0]},
										{latitude:v.position.coordinates[1],longitude:v.position.coordinates[0]}
									)
								}
								
								socfed_users[k2].photos = imgurl+'image/'+v.fb_id+'/0/?imgid='+v.photos[0];
							}else{
								socfed_users[k2].photos = imgurl+'image/'+v.fb_id+'/0/?imgid='+v.photos[0];
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
						var check_active = true
						if(typeof v.active != 'undefined'){
							if(v.active == false){
								check_active = false
							}else{
								check_active = true
							}
							
						}else{
							check_active = true
						}
						
						if(v.matchme == true && check_active == true && v.event_id != "57305dc4963c2207a02f3bf7"){
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
											if(v.points == null || typeof v.points == 'undefined'){
												json_data[n].points = 0;
											}else{
												json_data[n].points = v.points;
											}
											
											json_data[n].likes = 0;
											if(likes_fbid.length > 0){
												async.forEachOf(likes_fbid,function(vk,kk,ek){
													if(vk == v.fb_id){
														json_data[n].likes = 1
													}
												})
											}
											
											json_data[n].last_updated = v.last_viewed;
											json_data[n].image = v.photos;
											if(typeof v.distance != 'undefined'){
												json_data[n].distance = v.distance;
											}
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
												if(v.points == null || typeof v.points == 'undefined'){
													json_data[n].points = 0;
												}else{
													json_data[n].points = v.points;
												}
												
												json_data[n].likes = 0;
												if(likes_fbid.length > 0){
													async.forEachOf(likes_fbid,function(vk,kk,ek){
														if(vk == v.fb_id){
															json_data[n].likes = 1
														}
													})
												}
												
												json_data[n].last_updated = v.last_viewed;
												json_data[n].image = v.photos;
												if(typeof v.distance != 'undefined'){
													json_data[n].distance = v.distance;
												}
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
												if(v.points == null || typeof v.points == 'undefined'){
													json_data[n].points = 0;
												}else{
													json_data[n].points = v.points;
												}
												
												json_data[n].likes = 0;
												if(likes_fbid.length > 0){
													async.forEachOf(likes_fbid,function(vk,kk,ek){
														if(vk == v.fb_id){
															json_data[n].likes = 1
														}
													})
												}
												
												json_data[n].last_updated = v.last_viewed;
												json_data[n].image = v.photos;
												if(typeof v.distance != 'undefined'){
													json_data[n].distance = v.distance;
												}
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
					
					if(json_data.length > 40){
						json_data.length = 40;
					}
					
					if(json_data.length > 3){
						var fb_id_arr_last3 = [];
						var nn = 0;
						async.forEachOf(json_data,function(v,k,e){
							fb_id_arr_last3[nn] = v.from_fb_id;
							nn++;
						})
						var fb_id_arr_last3 = fb_id_arr_last3.slice(Math.max(fb_id_arr_last3.length - 3, 1))
						client.set("social_list_last3_"+fb_id,JSON.stringify(fb_id_arr_last3),function(err,suc){})
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

function get_likesdata(fb_id,next2){
	var _ = require('underscore')
	async.waterfall([
		function get_cust(cb){
			customers_coll.findOne({fb_id:fb_id},function(err,r){
				cb(null,r)
			})
		},
		function get_sync_event(rows_customers,cb){
			if(typeof rows_customers.likes_event != 'undefined' && rows_customers.likes_event != null && rows_customers.likes_event.length > 0){
				var in_eventid = [];
				var n = 0;
				async.forEachOf(rows_customers.likes_event,function(v,k,e){
					in_eventid[n] = new ObjectId(v.event_id)
					n++;
				})
				events_detail_coll.find({_id:{$in:in_eventid}}).toArray(function(err,r){
					if(err){
						debug.log('error social line 245');
						debug.log(err);
						cb(null,[])
					}else{
						var in_fbid = [];
						var m = 0;
						async.forEachOf(r,function(v,k,e){
							if(v.likes != null && typeof v.likes != 'undefined'){
								async.forEachOf(v.likes,function(ve,ke,ee){
									in_fbid[m] = ve.fb_id
									m++;
								})
							}
						})
						in_fbid = _.uniq(in_fbid)
						cb(null,in_fbid)
					}
				})
			}else{
				cb(null,[])
			}
		}
	],function(err,merge_data){
		next2(merge_data)
	})
}

// sort desc by last_updated Date
var sortDate = function (a, b){
	if(a.type_rank < b.type_rank) return 1;
	if(a.type_rank > b.type_rank) return -1;
	
	if(a.likes < b.likes) return 1;
	if(a.likes > b.likes) return -1;
	
	if(a.points < b.points) return 1;
	if(a.points > b.points) return -1;
	
	
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
	var fb_id = req.params.fb_id;
	var member_fb_id = req.params.member_fb_id;
	var match = req.params.match;
	
	client.get("social_list_"+fb_id,function(err,val){
		if(val == null){
			var nin_socfed = []
		}else{
			var nin_socfed = JSON.parse(val);
		}
		nin_socfed.push(member_fb_id)
		client.set("social_list_"+fb_id,JSON.stringify(nin_socfed),function(err,suc){
			if(!err){
				client.expire("social_list_"+fb_id,120);
			}
		})
	})
	
	
	
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
					var event_id = "";
					async.forEachOf(rows.users,function(v,k,e){
						if(v.fb_id == member_fb_id){
							if(v.from_state == "approved" && v.to_state == "approved"){
								cek = 1;
								event_id = v.event_id;
							}else{
								cek = 0;
							}
						}
					});
						
					cb(null,cek,event_id);
				});
			}else{
				req.app.get("helpers").logging("error","get","Function Error On First Function do_connect_n_updchat.connecting",req);
				cb(null,"err",[])
			}
		},
		function updating_chat(cek_isMatch,event_id,cb){
			if(cek_isMatch == 1){
				var ddcond = {
					fb_id:fb_id,
					"conversations.fb_id":member_fb_id
				}
				chatmessages_coll.findOne(ddcond,function(errs,cek_is_exist){
					if(cek_is_exist == undefined){
						update_chat(req,fb_id,member_fb_id,event_id,function(upd){})
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

function update_chat(req,fb_id,member_fb_id,event_id,next){
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
						data_conv.event_id = event_id;
						
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
							data_conv.event_id = event_id;
						
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
						data_conv.event_id = event_id;
						
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
							data_conv.event_id = event_id;
						
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

exports.parseDataChatEventId = function(req,res){
	// socialfeed_coll.find({}).toArray(function(err,r){
		// async.forEachOf(r,function(v,k,e){
			// async.forEachOf(v.users,function(ve,ke,ee){
				// var cond = {
					// fb_id:v.fb_id,
					// "conversations.fb_id":ve.fb_id
				// }
				// var form_upd = {
					// $set:{
						// "conversations.$.event_id":ve.event_id
					// }
				// }
				// chatmessages_coll.update(cond,form_upd,function(err,upd){
					// if(!err){
						// debug.log('updated '+v.fb_id+' => '+ve.fb_id)
					// }
				// })
			// })
		// })
	// })
	
	partyfeed_coll.find({}).toArray(function(err,r){
		async.forEachOf(r,function(v,k,e){
			var cond = {
				fb_id : v.fb_id,
				"conversations.fb_id":v.from_fb_id,
				"conversations.event_id":{$exists:false},
			}
			var form_upd = {
				$set:{
					"conversations.$.event_id":v.event_id
				}
			}
			chatmessages_coll.update(cond,form_upd,function(err,upd){
				if(!err){
					debug.log('updated '+v.fb_id+' => '+v.from_fb_id)
				}
			})
		})
	})
	
	res.json({success:true})
}

exports.count_data = function(req,res){
	var fb_id = req.params.fb_id;
	debug.log(fb_id)
	socialfeed_coll.findOne({fb_id:fb_id},function(err,r){
		if(err){
			debug.log(err)
			res.json({code_error:403})
		}else{
			if(r == null){
				res.json({code_error:204})
			}else{
				var inbound = 0;
				var outbound = 0;
				async.forEachOf(r.users,function(ve,ke,ee){
					if(ve.from_state == 'viewed' && ve.to_state == 'approved'){
						inbound++;
					}
					if(ve.from_state == 'viewed' && ve.to_state == 'viewed'){
						outbound++;
					}
				})
				res.json({
					fb_id:fb_id,
					outbound:outbound,
					inbound:inbound
				})
			}
			
		}
	})
}