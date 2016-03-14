require('./../models/emit');
var debug = require('./../config/debug');
var cache = require('./../config/cache');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');

var redis   = require("redis");
var client  = redis.createClient(6379,"jiggieappsredis.futsnq.0001.apse1.cache.amazonaws.com");

exports.index = function(req, res){
	req.app.get("helpers").logging("request","get","",req);
	
	var event_details_id = req.params.event_id;
	var fb_id = req.params.fb_id;
	var gender_interest = req.params.gender_interest;
	
	
	events_detail_coll.findOne({_id:new ObjectId(event_details_id)},function(errs,cek_eventid){
		customers_coll.findOne({fb_id:fb_id},function(errs,cek_fbid){
			if(cek_eventid == undefined){
				// 204 => No Content
				res.json({code_error:204})
			}else if(cek_fbid == undefined){
				// 403 => Invalid ID
				res.json({code_error:403})
			}else if(['male','female','both'].indexOf(gender_interest) == -1){
				// 403 => Invalid ID
				res.json({code_error:403})
			}else{
				getdata(event_details_id,fb_id,gender_interest,function(data){
					req.app.get("helpers").logging("response","get",JSON.stringify(data),req);
					var t = 0;
					var dt = [];
					async.forEachOf(data,function(v,k,e){
						if(v.fb_id){
							dt[t] = v;
							t++;
						}
					})
					var filter_dt = req.app.get('helpers').getUniqueArray(dt);
					res.json(filter_dt);
				});
			}
		})	
	})
};

function getdata(event_details_id,fb_id,gender_interest,next){
	gender_interest = gender_interest.toLowerCase();
	async.waterfall([
		function get_eventdetail(callback){
			var kk = "event_"+gender_interest+"_"+fb_id+'_'+event_details_id;
			client.get(kk,function(err,val){
				if(val == null){
					events_detail_coll.findOne({_id:new ObjectId(event_details_id)},function(err,rows){
						debug.log('not use cached');
						callback(null,rows);
					});
				}else{
					debug.log('use cached');
					callback(null,JSON.parse(val));
				}
			})
		},
		function get_socialfeed(rows_event,callback){
			var in_usersfbid = [];
			var n = 0;
			async.forEachOf(rows_event.guests_viewed,function(v,k,e){
				in_usersfbid[n] = v.fb_id;
				n++;
			})
			
			var cond_aggregate = [
				{$unwind:'$users'},
				{
					$match:{
						$and:[
							{fb_id:fb_id},
							{'users.fb_id':{$in:in_usersfbid}}
						]
					}
				}
			]
			socialfeed_coll.aggregate(cond_aggregate).toArray(function(err,rows){
				if(err){
					debug.log(err)
				}else{
					if(rows.length != 0 || typeof rows != 'undefined'){
						var users_rows = new Object();
						users_rows.users = []
						var x = 0;
						async.forEachOf(rows,function(v,k,e){
							users_rows.users[x] = v.users;
							x++;
						})
						async.setImmediate(function () {
							callback(null,rows_event,users_rows.users);
						});
					}
				}
			})
			// socialfeed_coll.findOne({fb_id:fb_id},function(err,rows){
				// if(err){
					// debug.log(err);
				// }else{
					// callback(null,rows.users);
				// }
			// })
		},
		function get_matche(rows_event,socfed_users,callback){
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
				callback(null,socfed_users,rows,rows_event);
			})
		},
		// function get_eventdetail(socfed_users,rows_cust,callback){
			// var kk = "event_"+gender_interest+"_"+fb_id+'_'+event_details_id;
			// client.get(kk,function(err,val){
				// if(val == null){
					// events_detail_coll.findOne({_id:new ObjectId(event_details_id)},function(err,rows){
						// debug.log('not use cached');
						// callback(null,socfed_users,rows_cust,rows);
					// });
				// }else{
					// debug.log('use cached');
					// callback(null,socfed_users,rows_cust,JSON.parse(val));
				// }
			// })
		// },
		function sync_eventdetail(socfed_users,rows_cust,rows,callback){
			// events_detail_coll.findOne({_id:new ObjectId(event_details_id)},function(err,rows){
			if(rows.guests_viewed.length > 0){
				async.forEachOf(rows_cust,function(v,k,e){
					async.forEachOf(rows.guests_viewed,function(v2,k2,e2){
						if(v.fb_id == v2.fb_id){
							if(v.matchme == undefined || v.matchme == true){
								rows.guests_viewed[k2].matchme = true;
							}else{
								rows.guests_viewed[k2].matchme = false;
							}
						}
					})
				})
				
				var json_data = [];
				var n = 0;
				async.forEachOf(rows.guests_viewed,function(v,k,e){
					if(v.matchme == true){
						if(v.fb_id != fb_id){
							if(gender_interest == "both"){
								async.forEachOf(socfed_users,function(ve,ke,ee){
									json_data[n] = new Object();
									if(v.fb_id == ve.fb_id){
										if(ve.from_state != 'denied' && ve.to_state != 'denied'){
											json_data[n].fb_id = ve.fb_id;
											json_data[n].first_name = ve.first_name;
											json_data[n].gender = ve.gender;
											json_data[n].about = ve.about;
											json_data[n].is_invited = false;
											json_data[n].is_connected = false;
											(ve.from_state == "approved") ? json_data[n].is_invited = true : json_data[n].is_invited = false;
											(ve.to_state == "approved" && ve.from_state == "approved") ? json_data[n].is_connected = true : json_data[n].is_connected = false;
											n++;
										}
									}
								});
							}else if(v.gender == gender_interest){
								async.forEachOf(socfed_users,function(ve,ke,ee){
									json_data[n] = new Object();
									if(v.fb_id == ve.fb_id){
										if(ve.from_state != 'denied' && ve.to_state != 'denied'){
											json_data[n].fb_id = ve.fb_id;
											json_data[n].first_name = ve.first_name;
											json_data[n].gender = ve.gender;
											json_data[n].about = ve.about;
											json_data[n].is_invited = false;
											json_data[n].is_connected = false;
											(ve.from_state == "approved") ? json_data[n].is_invited = true : json_data[n].is_invited = false;
											(ve.to_state == "approved" && ve.from_state == "approved") ? json_data[n].is_connected = true : json_data[n].is_connected = false;
											n++;
										}
									}
								});
							}
						}
					}
				})
				callback(null,json_data);
			}else{
				callback(null,[]);
			}
			// })
		}
	],function(err,json_data){
		try{
			if(err){
				throw err;
			}else{
				next(json_data);
			}
		}catch(e){
			
		}
	})
}



exports.connect = function(req,res){
	req.app.get("helpers").logging("request","get","",req);
	var fb_id = req.params.fb_id;
	var guest_fb_id = req.params.guest_fb_id;
	
	async_connect(req,fb_id,guest_fb_id,function(upd){
		if(upd == "err"){
			req.app.get("helpers").logging("response","get","{success:false}",req);
			res.json({success:false});
		}else{
			req.app.get("helpers").logging("response","get","{success:true}",req);
			res.json({success:true});
		}
	})
}

function async_connect(req,fb_id,guest_fb_id,next){
	async.parallel([
		function update_self_fromstate(cb){
			socialfeed_coll.findOne({fb_id:fb_id},function(err,rows){
				if(rows.users.length > 0){
					var cek_exist = 0;
					async.forEachOf(rows.users,function(v,k,e){
						if(v.fb_id == guest_fb_id){
							cek_exist = 1;
						}
					});
					
					if(cek_exist == 1){
						var cond = {
							fb_id:fb_id,
							"users.fb_id":guest_fb_id
						}
						var form = {$set:{"users.$.from_state":"approved"}}
						socialfeed_coll.update(cond,form,function(err,upd){
							if(err){
								debug.log(err);
							}
						})
					}else if(cek_exist == 0){
						req.app.get("helpers").logging("warning","get","Data Not Exist In Social Feed Collections",req);
						debug.log("Data Not Exist");
						
						var json_data = new Object();
						customers_coll.findOne({fb_id:guest_fb_id},function(err,dt){
							json_data.fb_id = guest_fb_id;
							json_data.first_name = dt.first_name;
							json_data.gender = dt.gender;
							json_data.last_viewed = new Date();
							json_data.event_id = "";
							json_data.event_name = "";
							json_data.didMatch = false;
							json_data.from_state = "approved";
							json_data.to_state = "viewed";
							
							socialfeed_coll.update({fb_id:fb_id},{
								$push:{users:json_data}
							},function(err,upd){
								if(err){
									debug.log(err);
								}
							})
						})
					}
					
					debug.log("updated from state");
					cb(null,"From State Updated Data");
				}else{
					req.app.get("helpers").logging("error","get","Error function event_interested=>async_connect=>update_self_fromstate",req);
					cb(null,"From State Updated Data No Updated");
				}
			})
		},
		function update_other_tostate(cb){
			socialfeed_coll.findOne({fb_id:guest_fb_id},function(err,rows){
				debug.log(rows);
				if(rows.users.length > 0){
					var cek_exist = 0;
					async.forEachOf(rows.users,function(v,k,e){
						if(v.fb_id == fb_id){
							cek_exist = 1;
						}
					})
					
					if(cek_exist == 1){
						var cond = {
							fb_id:guest_fb_id,
							"users.fb_id":fb_id
						}
						var form = {$set:{"users.$.to_state":"approved"}}
						socialfeed_coll.update(cond,form,function(err,upd){
							if(err){
								debug.log(err);
							}
						})
					}else if(cek_exist == 0){
						req.app.get("helpers").logging("warning","get","Data Not Exist In Social Feed Collections",req);
						debug.log("Data Not Exist");
						
						var json_data = new Object();
						customers_coll.findOne({fb_id:fb_id},function(err,dt){
							json_data.fb_id = fb_id;
							json_data.first_name = dt.first_name;
							json_data.gender = dt.gender;
							json_data.last_viewed = new Date();
							json_data.event_id = "";
							json_data.event_name = "";
							json_data.didMatch = false;
							json_data.from_state = "viewed";
							json_data.to_state = "approved";
							
							socialfeed_coll.update({fb_id:guest_fb_id},{
								$push:{users:json_data}
							},function(err,upd){
								if(err){
									debug.log(err);
								}
							})
						})
					}
					
					debug.log("updated to state");
					cb(null,"To State Updated Data No Updated");
				}else{
					req.app.get("helpers").logging("error","get","Error function event_interested=>async_connect=>update_other_tostate",req);
					cb(null,"To State Updated Data No Updated");
				}
			});
		}
	],function(err,merge){
		if(err){
			next("err");
		}else{
			next(merge);
		}
	})
}
