require('./../models/emit');
var debug = require('./../config/debug');
var cache = require('./../config/cache');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');

var redis   = require("redis");
var client  = redis.createClient(6379,"jiggieappsredis.futsnq.0001.apse1.cache.amazonaws.com");

exports.index = function(req, res){
	var event_details_id = req.params.event_id;
	var fb_id = req.params.fb_id;
	var gender_interest = req.params.gender_interest;
	gender_interest = gender_interest.toLowerCase();
	
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
			doall(req,event_details_id,fb_id,gender_interest,function(rows){
				req.app.get("helpers").logging("response","get",JSON.stringify(rows),req);
				res.json(rows);
			});
		}
	})	
	})
};

function doall(req,event_details_id,fb_id,gender_interest,next){
	gender_interest = gender_interest.toLowerCase();
	async.series([
		function getalldata(callback){
			getsyncdata(req,event_details_id,fb_id,gender_interest,function(alldata){
				callback(null,alldata)
			})
		},
		function updating(callback){
			upd_data(event_details_id,fb_id,function(upd){});
			callback(null,'next');
		},
		function update_socialfeed(callback){
			upd_socialfeed(event_details_id,fb_id,function(upd){});
			callback(null,'next');
		},
		function clean_data(cb){
			async.parallel([
				function cl(cbc){
					cleaning_data(event_details_id,function(dt){});
					cbc(null,'next');
				},
				function sf(cbc){
					cleansocfed(fb_id,function(dt){})
					cbc(null,'next');
				}
			],function(err,dtss){
				cb(null,dtss)
			})
		}
	],function(err,merge){
		next(merge[0]);
	})
}

function getsyncdata(req,event_details_id,fb_id,gender_interest,next){
	async.waterfall([
		function get_likes(callback){
			events_detail_coll.findOne({_id:new ObjectId(event_details_id)},function(err,rows_event){
				var dt = new Object()
				dt.is_liked = false
				if(typeof rows_event.likes != 'undefined'){
					dt.likes = rows_event.likes.length
					async.forEachOf(rows_event.likes,function(vv,kk,ee){
						if(vv.fb_id == fb_id){
							dt.is_liked = true
						}
					})
				}else{
					dt.likes = 0;
				}
				callback(null,dt)
			})
		},
		function getalldata(dt_likes,callback){
			client.get("event_"+gender_interest+"_"+fb_id+'_'+event_details_id,function(err,val){
				var all_data = new Object()
				if(val == null){
					getdata(req,event_details_id,fb_id,gender_interest,function(rows){
						client.set("event_"+gender_interest+"_"+fb_id+'_'+event_details_id,JSON.stringify(rows),function(err,suc){
							if(!err){
								debug.log("not cached");
								client.expire("event_"+gender_interest+"_"+fb_id+'_'+event_details_id,120);
								all_data = rows
								all_data.is_liked = dt_likes.is_liked
								all_data.likes = dt_likes.likes
								callback(null,all_data)
							}else{
								debug.log("Data Not Cached");
							}
						});	
					})
				}else{
					debug.log("cached")
					all_data = JSON.parse(val)
					all_data.is_liked = dt_likes.is_liked
					all_data.likes = dt_likes.likes
					callback(null,all_data)
				}
			})
		}
	],function(err,data){
		next(data)
	})
	
}

function cleansocfed(fb_id,next){
	socialfeed_coll.findOne({fb_id:fb_id},function(err,r){
		if(r != null){
			if(r.users.length > 0){
				var arr_fbid = [];
				var n = 0;
				var data_to_push = [];
				async.forEachOf(r.users,function(v,k,e){
					arr_fbid[n] = v.fb_id;
					data_to_push[n] = v;
					n++;
				})
				
				// check what double value //
				var dup_arr = [];
				var sorted_arr = arr_fbid.sort();
				for (var i = 0; i < arr_fbid.length - 1; i++) {
					if (sorted_arr[i + 1] == sorted_arr[i]) {
						dup_arr.push(sorted_arr[i]);
					}
				}
				// check what double value //
				
				async.forEachOf(dup_arr,function(v,k,e){
					async.waterfall([
						function upd1(cb){
							var upd_form = {
								$pull:{users:{fb_id:v}}
							}
							socialfeed_coll.update({_id:new ObjectId(r._id)},upd_form,function(err,upd){
								if(err){
									// debug.log('12');
									debug.log(err)
								}else{
									cb(null,1)
								}
							})
						},
						function upd2(dt,cb){
							var data_to_push_each = new Object();
							async.forEachOf(data_to_push,function(ve,ke,ee){
								if(ve.fb_id == v){
									data_to_push_each = ve
								}
							})
							
							var upd_form = {
								$push:{users:data_to_push_each}
							}
							socialfeed_coll.update({_id:new ObjectId(r._id)},upd_form,function(err,upd){
								if(err){
									// debug.log('12');
									debug.log(err);
								}
								cb(null,'next');
							})
						}
					],function(err,mgg){
						debug.log(mgg)
					})
				})
				debug.log('cl socfed');
				next('cleaning socfed')
			}else{
				next('no data');
			}
		}else{
			next('no data');
		}
	})
}

function cleaning_data(event_details_id,next){
	events_detail_coll.findOne({_id:new ObjectId(event_details_id)},function(err,r){
		if(r != null){
			if(typeof r.guests_viewed != 'undefined' && r.guests_viewed.length > 0){
				var arr_fbid = [];
				var data_to_push = [];
				var n = 0;
				async.forEachOf(r.guests_viewed,function(v,k,e){
					arr_fbid[n] = v.fb_id;
					data_to_push[n] = v;
					n++;
				})
				
				// check what double value //
				var dup_arr = [];
				var sorted_arr = arr_fbid.sort();
				for (var i = 0; i < arr_fbid.length - 1; i++) {
					if (sorted_arr[i + 1] == sorted_arr[i]) {
						dup_arr.push(sorted_arr[i]);
					}
				}
				// check what double value //
				
				async.forEachOf(dup_arr,function(v,k,e){
					async.waterfall([
						function upd1(cb){
							var upd_form = {
								$pull:{guests_viewed:{fb_id:v}}
							}
							events_detail_coll.update({_id:new ObjectId(r._id)},upd_form,function(err,upd){
								if(err){
									// debug.log('12');
									debug.log(err)
								}else{
									cb(null,1)
								}
							})
						},
						function upd2(dt,cb){
							var upd_form = {
								$push:{guests_viewed:data_to_push[k]}
							}
							events_detail_coll.update({_id:new ObjectId(r._id)},upd_form,function(err,upd){
								if(err){
									// debug.log('12');
									debug.log(err);
								}
								cb(null,'next');
							})
						}
					],function(err,mgg){
						debug.log(mgg)
					})
				})
				debug.log('cl guests_viewed');
				next('cleaning guests_viewed')
			}else{
				next('no data guests_viewed');
			}
		}else{
			next('no content');
		}
	})
}

function getdata(req,event_details_id,fb_id,gender_interest,next){
	async.waterfall([
		function get_eventdetail_or_cache(callback){
			var cond = {_id:new ObjectId(event_details_id)}
			events_detail_coll.find(cond).limit(1).toArray(function(err,rows){
				if(err){
					debug.log('error line 231 event details')
					debug.log(err);
				}else{
					callback(null,rows[0]);
				}
			});
		},
		function get_socialfeed(rows_event,callback){
			var in_usersfbid = [];
			var n = 0;
			if(rows_event.guests_viewed.length > 0){
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
						debug.log('error line 259 event details')
						debug.log(err)
					}else{
						if(rows.length != 0 || typeof rows != 'undefined'){
							var users_rows = new Object();
							// users_rows._id = rows[0]._id;
							// users_rows.fb_id = rows[0].fb_id;
							// users_rows.created_at = rows[0].created_at;
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
			}else{
				callback(null,rows_event,[]);
			}
			
			// socialfeed_coll.findOne({fb_id:fb_id},function(err,rows){
				// if(err){
					// debug.log(err);
				// }else{
					// if(rows != null){
						// if(rows.users != null){
							// debug.log(rows);
							// async.setImmediate(function () {
								// callback(null,rows_event,rows.users);
							// });
						// }else{
							// callback(null,[],[]);
						// }
					// }else{
						// callback(null,[],[]);
					// }
				// }
			// })
		},
		function get_matche(rows_event,socfed_users,callback){
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
					callback(null,socfed_users,rows,rows_event);
				})
			}else{
				callback(null,[],[],rows_event);
			}
		},
		function get_eventdetail(socfed_users,rows_cust,rows,callback){
			if(socfed_users.length > 0){
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
				
				var new_guestviewed = [];
				var x = 0;
				async.forEachOf(rows.guests_viewed,function(v,k,e){
					if(v.matchme == true){
						if(v.fb_id != fb_id){
							if(gender_interest == "both"){
								async.forEachOf(socfed_users,function(ve,ke,ee){
									if(v.fb_id == ve.fb_id){
										if(ve.from_state != 'denied' && ve.to_state != 'denied'){
											new_guestviewed[x] = new Object();
											new_guestviewed[x].fb_id = v.fb_id;
											new_guestviewed[x].first_name = v.first_name;
											new_guestviewed[x].gender = v.gender;
											(ve.from_state == "approved") ? new_guestviewed[x].is_invited = true : new_guestviewed[x].is_invited = false;
												(ve.to_state == "approved" && ve.from_state == "approved") ? new_guestviewed[x].is_connected = true : new_guestviewed[x].is_connected = false;
											x++;
										}
									}
								})
							}else if(gender_interest == "female"){
								if(v.gender == "female"){
									async.forEachOf(socfed_users,function(ve,ke,ee){
										if(v.fb_id == ve.fb_id){
											if(ve.from_state != 'denied' && ve.to_state != 'denied'){
												new_guestviewed[x] = new Object();
												new_guestviewed[x].fb_id = v.fb_id;
												new_guestviewed[x].first_name = v.first_name;
												new_guestviewed[x].gender = v.gender;
												(ve.from_state == "approved") ? new_guestviewed[x].is_invited = true : new_guestviewed[x].is_invited = false;
												(ve.to_state == "approved" && ve.from_state == "approved") ? new_guestviewed[x].is_connected = true : new_guestviewed[x].is_connected = false;
												x++;
											}
										}
									})
								}
							}else if(gender_interest == "male"){
								if(v.gender == "male"){
									async.forEachOf(socfed_users,function(ve,ke,ee){
										if(v.fb_id == ve.fb_id){
											if(ve.from_state != 'denied' && ve.to_state != 'denied'){
												new_guestviewed[x] = new Object();
												new_guestviewed[x].fb_id = v.fb_id;
												new_guestviewed[x].first_name = v.first_name;
												new_guestviewed[x].gender = v.gender;
												(ve.from_state == "approved") ? new_guestviewed[x].is_invited = true : new_guestviewed[x].is_invited = false;
												(ve.to_state == "approved" && ve.from_state == "approved") ? new_guestviewed[x].is_connected = true : new_guestviewed[x].is_connected = false;
												x++;
											}
										}
									})
								}
							}
						}
					}
				})
				var filter_guestviewed = req.app.get('helpers').getUniqueArray(new_guestviewed);
				rows.guests_viewed = filter_guestviewed;
			}
			
			callback(null,rows);
				
		},
		function get_venue(event_item,callback){
			var cond = {_id:new ObjectId(event_item.venue_id)}
			venues_coll.findOne(cond,function(err,rows){
				if(err){
					debug.log(err);
				}else{
					callback(null,event_item,rows);
				}
			});
		}
	],function(err,rows_event,rows_venue){
		var dt = new Object();
		dt._id = rows_event._id;
		dt.event_id = rows_event.event_id;
		dt.start_datetime = rows_event.start_datetime;
		dt.end_datetime = rows_event.end_datetime;
		dt.venue_id = rows_event.venue_id;
		dt.venue_name = rows_event.venue_name;
		dt.start_datetime_str = rows_event.start_datetime_str;
		dt.end_datetime_str = rows_event.end_datetime_str;
		dt.fullfillment_type = rows_event.fullfillment_type;
		dt.fullfillment_value = rows_event.fullfillment_value;
		
		var photos = new Object();
		photos = rows_event.photos;
		async.forEachOf(rows_venue.photos,function(v,k,e){
			photos.push(v);
		});
		dt.photos = photos;
		
		dt.guests_viewed = rows_event.guests_viewed;
		dt.description = rows_event.description;
		dt.title = rows_event.title;
		dt.tags = rows_event.tags;
		
		dt.venue = new Object();
		dt.venue._id = rows_venue._id;
		dt.venue.address = rows_venue.address;
		dt.venue.neighborhood = rows_venue.neighborhood;
		dt.venue.city = rows_venue.city;
		dt.venue.description = rows_venue.description;
		dt.venue.long = rows_venue.long;
		dt.venue.lat = rows_venue.lat;
		dt.venue.zip = rows_venue.zip;
		dt.venue.name = rows_venue.name;
		dt.venue.photos = new Object();
		dt.venue.photos = rows_venue.photos;
		
		next(dt);
	})
}

function upd_data(event_details_id,fb_id,next){
	async.waterfall([
		function cek_data(callback){
			var cond = {
				_id : new ObjectId(event_details_id),
				"guests_viewed.fb_id": String(fb_id)
			}
			events_detail_coll.findOne(cond,function(err,rows){
				if(rows != null){
					callback(null,""); // Data Exist
				}else{
					callback(null,1); // Data Not Exist
				}
				
			})
		},
		function cek_profile(st1,callback){
			if(st1 == 1){
				customers_coll.findOne({fb_id:fb_id},function(err,rows){
					if(rows == null){
						debug.log("Customers ID Invalid");
						callback(null,"");
					}else{
						callback(null,rows);
					}
				});
			}else{
				callback(null,"");
			}
		},
		function update_views(data_profile,callback){
			if(data_profile != ""){
				
				var data_viewed = new Object();
				data_viewed.fb_id = data_profile.fb_id;
				data_viewed.first_name = data_profile.first_name;
				data_viewed.gender = data_profile.gender;
				data_viewed.about = data_profile.about;
				
				var cond = {
					_id : new ObjectId(event_details_id)
				}
				var form_post = {
					$push : {
						viewed : fb_id,
						guests_viewed : data_viewed
					}
				}
				
				events_detail_coll.update(cond,form_post,function(err,upd){
					if(err){
						debug.log(err);
					}else{
						callback(null,"updated");
					}
				})
			}else{
				callback(null,"Guest Viewed Already Exist");
			}
		}
	],function(err,merge){
		next(merge);
	})
}

function upd_socialfeed(event_details_id,fb_id,next){
	async.waterfall([
		function get_eventdetail(callback){
			var data_guestviewed = [];
			var cond = {
				_id:new ObjectId(event_details_id)
			}
			events_detail_coll.findOne(cond,function(err,rows){
				var n=0;
				async.forEachOf(rows.guests_viewed,function(v,k,e){
					v.event_id = event_details_id;
					v.event_name = rows.title;
					if(v.fb_id != fb_id){
						data_guestviewed[n] = v;
						n++;
					}
				});
				callback(null,data_guestviewed);
			});
		},
		function updsocialfeed(guests_viewed,callback){
			updsocialfeed_async(guests_viewed,fb_id,function(upd){
				callback(null,upd);
			})
		}
	],function(err,data){
		next(data);
	})
}

function updsocialfeed_async(guests_viewed,fb_id,next){
	var in_fb_id = [];
	async.forEachOf(guests_viewed,function(v,k,e){
		in_fb_id[k] = v.fb_id;
	});
	
	async.parallel([
		function upd_others(cb){
			var json_data = new Object();
			customers_coll.findOne({fb_id:fb_id},function(err,usersdt){
				var cond = {
					fb_id:{$in:in_fb_id},
					// "users.fb_id":{$ne:fb_id}
				}
				socialfeed_coll.findOne({fb_id:fb_id},function(err,rownsoc){
					if(typeof rownsoc.points == 'undefined' || rownsoc.points == null){
						rownsoc.points = 0;
					}
					socialfeed_coll.find(cond).toArray(function(err,rows){
						if(rows.length > 0){
							async.forEachOf(rows,function(v,k,e){
								
								var cek_exist = 0;
								async.forEachOf(v.users,function(ve,ke,ee){
									if(ve.fb_id == fb_id){
										cek_exist = 1;
									}
								})
								
								if(cek_exist == 1){
									var cond2 = {
										_id:new ObjectId(v._id),
										"users.fb_id":fb_id
									}
									var form2 = {
										$set:{
											"users.$.last_viewed":new Date(),
											"users.$.event_id":guests_viewed[0].event_id,
											"users.$.event_name":guests_viewed[0].event_name,
											"users.$.points":String(rownsoc.points)
										}
									}
									socialfeed_coll.update(cond2,form2,function(err,upd){
										if(err){
											debug.log("Err Code:312");
											debug.log(err);
										}
									})
									// debug.log("update aja");
								
								
								}else if(cek_exist == 0){
								
								
									json_data.fb_id = usersdt.fb_id;
									json_data.first_name = usersdt.first_name;
									json_data.gender = usersdt.gender;
									json_data.last_viewed = new Date();
									json_data.event_id = guests_viewed[0].event_id;
									json_data.event_name = guests_viewed[0].event_name;
									json_data.points = String(rownsoc.points);
									json_data.didMatch = false;
									json_data.from_state = "viewed";
									json_data.to_state = "viewed";
									
									socialfeed_coll.update({_id:new ObjectId(v._id)},{$push:{users:json_data}},function(err,upd){
										if(err){
											debug.log("Err code:111231231");
											debug.log(err);
										}
									})
									// debug.log("push baru");

								}
								
							});
							cb(null,"New Data Others Just Added");
						}else{
							cb(null,"No Data Others Can Be Added");
						}
						
					});
				})
			})
			
		},
		function upd_self(cb){
			socialfeed_coll.findOne({fb_id:fb_id},function(err,rows){
				if(rows == null){
					var json_data = new Object();
					json_data.fb_id = fb_id;
					json_data.created_at = new Date();
					
					json_data.users = [];
					json_data.points = 0;
					
					var n = 0;
					async.forEachOf(guests_viewed,function(v,k,e){
						json_data.users[n] = new Object();
						json_data.users[n].fb_id = v.fb_id;
						json_data.users[n].first_name = v.first_name;
						json_data.users[n].gender = v.gender;
						json_data.users[n].last_viewed = new Date();
						json_data.users[n].event_id = v.event_id;
						json_data.users[n].event_name = v.event_name;
						json_data.users[n].didMatch = false;
						json_data.users[n].from_state = "viewed";
						json_data.users[n].to_state = "viewed";
						n++;
					});
					
					socialfeed_coll.insert(json_data,function(err,upd){
						if(err){
							debug.log(err);
						}
					})
					cb(null,"Adding Self SocialFeed");
				}else{
					if(guests_viewed.length > 0){
						async.forEachOf(guests_viewed,function(v,k,e){
							
							var cond2 = {
								fb_id:fb_id,
								"users.fb_id":v.fb_id
							}
							socialfeed_coll.findOne(cond2,function(err,rself){
								if(rself != null){
									// update other socialfeed in self
									var cond3 = {
										fb_id:fb_id,
										"users.fb_id":v.fb_id
									}
									var form_upd3 = {
										$set:{
											"users.$.last_viewed":new Date(),
											"users.$.event_id":guests_viewed[0].event_id,
											"users.$.event_name":guests_viewed[0].event_name
										}
									}
									// debug.log(guests_viewed[0].event_name);
									// debug.log(fb_id);
									socialfeed_coll.update(cond3,form_upd3,function(err,upd){
										if(err){
											debug.log(err);
										}else{
											// debug.log('updating self data socfed');
										}
									})
								}else{
									// push new socialfeed in self
									customers_coll.findOne({fb_id:v.fb_id},function(err,rcs){
										var json_data = new Object();
										json_data.fb_id = v.fb_id;
										json_data.first_name = rcs.first_name;
										json_data.gender = rcs.gender;
										json_data.last_viewed = new Date();
										json_data.event_id = guests_viewed[0].event_id;
										json_data.event_name = guests_viewed[0].event_name;
										json_data.didMatch = false;
										json_data.from_state = "viewed";
										json_data.to_state = "viewed";
										
										socialfeed_coll.update({fb_id:fb_id},{$push:{users:json_data}},function(err,upd){
											if(err){
												debug.log("Err code:323213");
												debug.log(err);
											}
										})
										// debug.log("push baru self");
									})
								}
							})
						
						})
						
					}
					cb(null,"SocialFeed Already Exist");
				}
			})
		}
		
	],function(err,data){
		next(data);
	})
}



function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\n/g, "nl");
 }
