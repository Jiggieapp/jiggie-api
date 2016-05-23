require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID; 
var curl = require('request');
var xssFilters = require('xss-filters');
var _ = require('underscore')

exports.social_friends = function(req,res){
	get_social_friends(req,function(dt){
		res.json(dt)
	})
}

function get_social_friends(req,next){
	var post = req.body;
	var arr_fb_id = post.friends_fb_id;
	var fb_id = xssFilters.inHTMLData(post.fb_id);
	var event_fb_id = arr_fb_id.concat([fb_id])
	
	var el = event_fb_id[0]
	var le = event_fb_id[event_fb_id.length-1];
	event_fb_id[0] = le
	event_fb_id[event_fb_id.length-1] = el
	
	async.waterfall([
		function check_self(cb){
			customers_coll.findOne({fb_id:fb_id},function(err,r){
				if(err){
					debug.log(err);
					debug.log('error line 24 social friends')
					cb(null,false,{error_code:403})
				}else if(r == null){
					debug.log('error line 27 social friends NO DATA SELF')
					cb(null,false,{code_error:204})
				}else{
					cb(null,true,{})
				}
			})
		},
		function check_others(stat,code,cb){
			if(stat == true){
				var cond = {
					fb_id:{$in:arr_fb_id}
				}
				customers_coll.find(cond).toArray(function(err,r){
					if(err){
						debug.log(err);
						debug.log('error line 42 social friends')
						cb(null,false,{error_code:403})
					}else if(r.length <= 0){
						debug.log('error line 46 social friends NO DATA OTHERS')
						cb(null,false,{code_error:204})
					}else if(parseInt(r.length) != parseInt(arr_fb_id.length)){
						debug.log('error line 48 social friends DATA NOT MATCH')
						cb(null,false,{code_error:403})
					}else{
						cb(null,true,{})
					}
				})
			}else{
				cb(null,false,code)
			}
		},
		function get_chat_and_sync(stat,code,cb){
			if(stat == true){
				var tot_time = 0
				async.forEachOf(event_fb_id,function(v,k,e){
					var url_event = "http://127.0.0.1:11223/app/v3/event/details/57305dc4963c2207a02f3bf7/"+v+"/both";
					var options_event = {
						url:url_event
					}
					setTimeout(function(){
					curl.get(options_event,function(err,resp,body){
						if (!err && resp.statusCode == 200) {
							
						}
					})
					},1000*(k+1))
					
					if(v != fb_id){
						var cond = {
							fb_id:fb_id,
							"conversations.fb_id":v
						}
						chatmessages_coll.findOne(cond,function(err,r){
							if(r == null){
								var url = "http://127.0.0.1:31213/app/v3/partyfeed_socialmatch/match/"+fb_id+"/"+v+"/approved"
								var options = {
									url:url
								}
								setTimeout(function(){
								curl.get(options,function(err,resp,body){
									if (!err && resp.statusCode == 200) {
										
									}
								})
								},2000*(k+1))
								
								
								var url2 = "http://127.0.0.1:31213/app/v3/partyfeed_socialmatch/match/"+v+"/"+fb_id+"/approved"
								var options2 = {
									url:url2
								}
								setTimeout(function(){
								curl.get(options2,function(err,resp,body){
									debug.log(resp.statusCode)
								})
								},3000*(k+1))
							}
						})
					}
					tot_time++;
				})
				
				cb(null,true,tot_time,{})
			}else{
				cb(null,false,0,code)
			}
		}
	],function(err,stat,tot_time,stat_code){
		if(stat == true){
			setTimeout(function(){
				next({success:true})
			},3500*tot_time)
			
		}else{
			next(stat_code)
		}
	})
}

exports.list_social_friends = function(req,res){
	list_social_friends(req,function(dt){
		res.json(dt)
	})
}

function list_social_friends(req,next){
	var post = req.body;
	var fb_id = xssFilters.inHTMLData(post.fb_id)
	var friends_fb_id = post.friends_fb_id
	// debug.log(fb_id)
	
	async.waterfall([
		function get_chat(cb){
			chatmessages_coll.findOne({fb_id:fb_id},function(err,r){
				if(err){
					debug.log(err);
					debug.log('error line 150 friends commerce')
					cb(null,false,[],{code_error:403})
				}else if(r == null){
					debug.log('error line 153 friends commerce NO DATA')
					cb(null,false,[],{code_error:204})
				}else{
					cb(null,true,r,{})
				}
			})
		},
		function get_rewards(stat,rows_chat,code,cb){
			if(stat == true){
				rewardcredit_coll.findOne({type:'appinvite',models:'inviter',plot:'credit'},function(err,r){
					if(err){
						debug.log(err);
						debug.log('error line 164 friends commerce')
						cb(null,false,[],[],{code_error:403})
					}else if(r == null){
						debug.log('error line 167 friends commerce NO DATA')
						cb(null,false,[],[],{code_error:204})
					}else{
						cb(null,true,rows_chat,r,{})
					}
				})
			}else{
				cb(null,false,[],[],code)
			}
		},
		function sync_data(stat,rows_chat,rows_rewards,code,cb){
			if(stat == true){
				var filter_fb_id = []
				var n = 0
				
				async.forEachOf(rows_chat.conversations,function(v,k,e){
					if(v.block == true || typeof v.event_id == 'undefined'){
						debug.log("jgn munculin");
					}else{
						filter_fb_id[n] = v.fb_id;
						n++;
					}
				})
				
				var filter_friends_fb_id = _.difference(friends_fb_id,filter_fb_id)
				
				var fb_id_union = _.union(filter_fb_id,filter_friends_fb_id);
				
				customers_coll.find({fb_id:{$in:fb_id_union}}).toArray(function(err,r){
					if(err){
						debug.log(err);
						debug.log('error line 179 friends commerce')
						cb(null,false,[],{code_error:403})
					}else if(r.length <= 0){
						debug.log('error line 182 friends commerce NO DATA')
						cb(null,false,[],{code_error:204})
					}else{
						var json_data = []
						var m = 0
						async.forEachOf(r,function(v,k,e){
							var img_url = "";
							// if(typeof v.photos[0] == 'undefined'){
								// img_url = "";
							// }else{
								// img_url = v.photos[0];
							// }
							
							// if(img_url.indexOf("?oh=") >= 0 && img_url.indexOf("&oe=") >= 0){
								// img_url = v.photos[0];
							// }else{
								// img_url = "http://img.jiggieapp.com/event?url="+v.photos[0];
							// }
							var uurl = "https://graph.facebook.com/"+v.fb_id+"/picture?type=large"
							// img_url = "http://img.jiggieapp.com/event?url="+uurl
							img_url = uurl
							
							var cfirst_name,clast_name
							if(v.first_name == "" || v.first_name == null || typeof v.first_name == "undefined"){
								cfirst_name = ""
							}else{
								cfirst_name = v.first_name.capitalizeFirstLetter()
							}
							if(v.last_name == "" || v.last_name == null || typeof v.last_name == "undefined"){
								clast_name = ""
							}else{
								clast_name = v.last_name.capitalizeFirstLetter()
							}
							
							json_data[m] = new Object()
							json_data[m].fb_id = v.fb_id;
							json_data[m].img_url = img_url
							json_data[m].first_name = cfirst_name
							json_data[m].last_name = clast_name
							json_data[m].about = v.about
							json_data[m].credit = parseInt(rows_rewards.rewards)
							
							async.forEachOf(filter_fb_id,function(ve,ke,ee){
								if(ve == v.fb_id){
									json_data[m].is_connect = true
								}
							})
							
							async.forEachOf(filter_friends_fb_id,function(ve,ke,ee){
								if(ve == v.fb_id){
									json_data[m].is_connect = false
								}
							})
							
							m++;
							
						})
						json_data = _.sortBy(json_data,'first_name')
						cb(null,true,json_data,{})
					}
				})
				
			}else{
				cb(null,false,[],code)
			}
			
		}
	],function(err,stat,json_data,code){
		if(stat == true){
			next(json_data)
		}else{
			next(code)
		}
	})
	
	String.prototype.capitalizeFirstLetter = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	}
}