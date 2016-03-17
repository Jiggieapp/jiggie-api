require('./../models/emit');
var debug = require('./../config/debug');
var cache = require('./../config/cache');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var cron = require('cron').CronJob;


/*
Cron Jobs
1. new_event => Push to Everyone latest 7 days events,
2. match_chat => Push to Everyone count chat request and count suggested match,
3. expire => Push to Everyone count chat request and count suggested match will expire,
3. flush => Remove Everyone data from social_feed collection where inbound and outbound,
*/


exports.index = function(req,res){
	start_jobs(req,function(){
		debug.log("JOBS Running");
		res.json({success:true});
	})
}

function start_jobs(req,next){
	autonotif_coll.find({}).toArray(function(err,r){
		async.forEachOf(r,function(v,k,e){
			if(v.type == 'new_event'){
				var job = new cron({
				  cronTime: v.schedule,
				  onTick: function() {
					push_new_event(req,function(dt){
						debug.log('PUSH START NEW EVENT');
						debug.log(dt);
					})
				  },
				  start: true,
				  timeZone: 'Asia/Jakarta'
				});
				job.start();
			}else if(v.type == 'match_chat'){
				var job = new cron({
				  cronTime: v.schedule,
				  onTick: function() {
					push_matchchat(req,function(dt){
						debug.log('PUSH START NEW CHAT MATCH');
						debug.log(dt);
					})
				  },
				  start: true,
				  timeZone: 'Asia/Jakarta'
				});
				job.start();
			}else if(v.type == 'expire'){
				var job = new cron({
				  cronTime: v.schedule,
				  onTick: function() {
					push_expire(req,function(dt){
						debug.log('PUSH START NEW EXPIRE');
						debug.log(dt);
					})
				  },
				  start: true,
				  timeZone: 'Asia/Jakarta'
				});
				job.start();
			}else if(v.type == 'flush'){
				var job = new cron({
				  cronTime: v.schedule,
				  onTick: function() {
					flush_socfed(req,function(dt){
						debug.log('FLUSH SOCIAL FEED DATA');
						debug.log(dt);
					})
				  },
				  start: true,
				  timeZone: 'Asia/Jakarta'
				});
				job.start();
			}else if(v.type == 'commerce'){
				var job = new cron({
				  cronTime: v.schedule,
				  onTick: function() {
					commerce_startnotif(req,function(dt){
						debug.log('START COMMERCE NOTIF');
						debug.log(dt);
					})
				  },
				  start: true,
				  timeZone: 'Asia/Jakarta'
				});
				job.start();
			}else if(v.type == 'event'){
				var job = new cron({
				  cronTime: v.schedule,
				  onTick: function() {
					eventdetails_startnotif(req,function(dt){
						debug.log('START EVENT NOTIF');
						debug.log(dt);
					})
				  },
				  start: true,
				  timeZone: 'Asia/Jakarta'
				});
				job.start();
			}
			
		})
		next();
	})
}

/*Start: Push Event*/
function push_new_event(req,next){
	async.parallel([
		function new_event(cb){
			async.waterfall([
				function get_count(cb2){
					count_event(req,function(dt){
						cb2(null,dt);
					})
				},
				function sync_message(count_event,cb2){
					autonotif_coll.findOne({type:'new_event'},function(err,r){
						var push_message = r.text.replace('{x}',count_event);
						cb2(null,push_message);
					})
				},
				function push_notif(message,cb2){
					var options = {
						url:'http://127.0.0.1:16523/apn_all',
						form:{message:message,type:'general'}
					}
					request.post(options,function(err,resp,body){
						if (!err && resp.statusCode == 200) {
							cb2(null,true)
						}else{
							debug.log('Failed Push Notif');
							cb2(null,false);
						}
					})
				}
			],function(err,merge){
				cb(null,merge);
			})
		}
	],function(err,pass){
		next(pass);
	})
	
}

function count_event(req,next){
	var days = 8; // Interval Data for Events
	var from_date = new Date();
	var to_date = req.app.get("helpers").intervalDate(days);
	
	async.waterfall([
		function get_event(cb){
			var cond = {
				end_datetime:{
					$gte : from_date
				},
				active:{$ne:false},
				status:'published'
			}
			
			events_detail_coll.find(cond).sort({start_datetime:1}).toArray(function(err,rows){
				if(err){
					debug.log('error get data event');
					cb(null,false,[]);
				}else{
					if(rows.length > 0){
						cb(null,true,rows);
					}else{
						debug.log('no data exist');
						cb(null,false,[]);
					}
					
				}
			});
		},
		function sync_data(stat,rows_event,cb){
			if(stat == true){
				var json_data = [];
				var to_date_filter = req.app.get("helpers").intervalDateFilter(7);
				if(rows_event.length > 0 ){
					async.forEachOf(rows_event,function(v,k,e){
						json_data[k] = new Object();
						json_data[k]._id = v._id;
						json_data[k].rank = v.rank;
						json_data[k].title = v.title;
						json_data[k].venue_name = v.venue_name;
						json_data[k].start_datetime = v.start_datetime;
						json_data[k].end_datetime = v.end_datetime;
						json_data[k].special_type = "Trending";
						json_data[k].tags = v.tags;
						
						var dd = new Date(v.start_datetime);
						json_data[k].start_date = new Date(dd.getFullYear(),dd.getMonth(),dd.getDate());
						
						
					});
					var filtered_array = [];
					var n = 0;
					async.forEachOf(json_data,function(v,k,e){
						if(v.start_date <= to_date_filter){
							filtered_array[n] = v;
						}
						n++;
					})
					cb(null,filtered_array.length)
				}
			}else{
				cb(null,false)
			}
		}
	],function(err,merge){
		if(merge == false){
			next({code_error:403})
		}else{
			next(merge);
		}
	})
}
/*End:Push Event*/

/*Start: Push new Segested and Chat
chat first params => inbound
match second params => outbound
*/
function push_matchchat(req,next){
	async.waterfall([
		function get_autonotif(cb){
			autonotif_coll.findOne({type:'match_chat'},function(err,r){
				if(err){
					debug.log('data match_chat empty');
					cb(null,false,[])
				}else{
					cb(null,true,r)
				}
			});
		},
		function push(stat,at,cb){
			if(stat == true){
				var msg = at.text.split('|');
				socialfeed_coll.find({}).toArray(function(err,r){
					async.forEachOf(r,function(v,k,e){
						var tot_inbound = 0; // request chat
						var tot_outbound = 0; // suggested match
						async.forEachOf(v.users,function(ve,ke,ee){
							if(ve.from_state == 'viewed' && ve.to_state == 'approved'){
								tot_inbound++;
							}else if(ve.from_state == 'viewed' && ve.to_state == 'viewed'){
								tot_outbound++;
							}
						})
						var push_message = '';
						if(tot_inbound > 0 && tot_outbound == 0){
							push_message = msg[0].replace('{x}',tot_inbound);
						}else if(tot_inbound == 0 && tot_outbound > 0){
							push_message = msg[1].replace('{x}',tot_outbound);
						}else{
							push_message = msg[0].replace('{x}',tot_inbound)+' and '+msg[1].replace('{x}',tot_outbound);
						}
						
						var options = {
							url:'http://127.0.0.1:16523/apn',
							form:{
									fb_id:v.fb_id,
									message:push_message,
									route:'',
									fromId:'123456',
									type:'social',
									event_id:''
								}
						}
						request.post(options,function(err,resp,body){
							if (!err && resp.statusCode == 200) {
								debug.log('Push Notif Auto');
							}else{
								debug.log('Failed Push Notif line 212');
							}
						})
					})
					cb(null,true);
				})
			}else{
				debug.log('error 178 false');
				cb(null,false);
			}
		}
	],function(err,merge){
		if(merge == false){
			next(false);
		}else{
			next(true);
		}
	})
}

/*End: Push new Segested and Chat*/


/*Start : Expire 
chat first params => inbound
match second params => outbound
Etc Third Params
*/
function push_expire(req,next){
	async.waterfall([
		function get_autonotif(cb){
			autonotif_coll.findOne({type:'expire'},function(err,r){
				if(err){
					debug.log('data expire empty');
					cb(null,false,[])
				}else{
					cb(null,true,r)
				}
			});
		},
		function push(stat,at,cb){
			if(stat == true){
				var msg = at.text.split('|');
				socialfeed_coll.find({}).toArray(function(err,r){
					async.forEachOf(r,function(v,k,e){
						var tot_inbound = 0; // request chat
						var tot_outbound = 0; // suggested match
						async.forEachOf(v.users,function(ve,ke,ee){
							if(ve.from_state == 'viewed' && ve.to_state == 'approved'){
								tot_inbound++;
							}else if(ve.from_state == 'viewed' && ve.to_state == 'viewed'){
								tot_outbound++;
							}
						})
						var push_message = '';
						if(tot_inbound > 0 && tot_outbound == 0){
							push_message = msg[0].replace('{x}',tot_inbound)+' '+msg[2];
						}else if(tot_inbound == 0 && tot_outbound > 0){
							push_message = msg[1].replace('{x}',tot_outbound)+' '+msg[2];;
						}else{
							push_message = msg[0].replace('{x}',tot_inbound)+' and '+msg[1].replace('{x}',tot_outbound)+' '+msg[2];;
						}
						
						var options = {
							url:'http://127.0.0.1:16523/apn',
							form:{
									fb_id:v.fb_id,
									message:push_message,
									route:'',
									fromId:'123456',
									type:'social',
									event_id:''
								}
						}
						request.post(options,function(err,resp,body){
							if (!err && resp.statusCode == 200) {
								debug.log('Push Notif Auto Expire');
							}else{
								debug.log('Failed Push Notif line 301');
							}
						})
					})
					cb(null,true);
				})
			}else{
				debug.log('error 308 false');
				cb(null,false);
			}
		}
	],function(err,merge){
		if(merge == false){
			next(false);
		}else{
			next(true);
		}
	})
}
/*End : Expire*/



/*Start : Flush Social Feed Data*/
function flush_socfed(req,next){
	async.waterfall([
		function algorithm_points(cb){
			socialfeed_coll.find({}).toArray(function(err,r){
				if(err){
					debug.log(err);
					cb(null,false)
				}else{
					async.forEachOf(r,function(v,k,e){
						var tot_yes = 0;
						var tot_no = 0;
						var uv = 0;
						var maturity = 0;
						var treshold_maturity = 20;
						var points = 0;
						async.forEachOf(v.users,function(ve,ke,ee){
							if(ve.to_state == 'approved'){
								tot_yes++;
							}
							if(ve.to_state == 'denied'){
								tot_no++;
							}
						})
						uv = parseInt(v.users.length) - (parseInt(tot_yes) + parseInt(tot_no));
						
						if(uv < treshold_maturity){
							maturity = parseFloat(uv)/parseFloat(treshold_maturity);
						}else if(uv >= treshold_maturity){
							maturity = 1;
						}
						
						// social algoritm
						var alpha = parseFloat(tot_yes)/(parseFloat(tot_yes)+parseFloat(tot_no));
						if(String(alpha) == 'NaN'){alpha = 0;}
						points = (alpha)*parseFloat(maturity);
						if(String(points) == 'NaN'){points = 0;}
						
						socialfeed_coll.update({fb_id:v.fb_id},{
							$set:{
								points_data:{
									tot_yes :String(tot_yes),
									tot_no:String(tot_no),
									uv:String(uv),
									maturity:String(maturity)
								},
								points:String(points)
							}
						},function(err,upd){})
					})
					cb(null,true);
				}
			})
		},
		function flushing(stat,cb){
			if(stat == true){
				var form_upd = {
					$pull:{
						users:{
							$or:[
								{from_state:'viewed',to_state:'viewed'},
								{from_state:'approved',to_state:'viewed'},
								{from_state:'viewed',to_state:'approved'}
							]
						}
					}
				}
				
				socialfeed_coll.update({},form_upd,{multi:true},function(err,upd){
					if(err){
						debug.log(err);
						cb(null,false);
					}else{
						cb(null,true);
					}
				})
			}else{
				cb(null,false)
			}
		}
	],function(err,data){
		next(data);
	})
}
/*End : Flush Social Feed Data*/


/*Start : commerce*/
function commerce_startnotif(req,next){
	var options = {
		url:'http://127.0.0.1:24534/notif_handle'
	}
	request.get(options,function(err,resp,body){
		if(!err){
			next(true);
		}else{
			next(false);
		}
	})
}
/*End : commerce*/

/*Start: event_details*/
function eventdetails_startnotif(req,next){
	async.waterfall([
		function get_autonotif(cb){
			autonotif_coll.findOne({type:'event'},function(err,r){
				if(err){
					debug.log('data event empty');
					cb(null,false,[])
				}else{
					cb(null,true,r)
				}
			});
		},
		function push_notif(stat,rows,cb){
			if(stat == true){
				var msg = rows.text;
				var event_id = rows.event_id;
				if(typeof msg != 'undefined' && msg != null && msg != '' && typeof event_id != 'undefined' && event_id != null && event_id != ''){
					var options = {
						url:'http://127.0.0.1:16523/apn_all',
						form:{
							message:msg,
							type:'event',
							event_id:event_id
						}
					}
					request.post(options,function(err,resp,body){
						if (!err && resp.statusCode == 200) {
							cb2(null,true)
						}else{
							debug.log('Failed Push Notif');
							cb2(null,false);
						}
					})
				}else{
					cb(null,false)
				}
			}else{
				cb(null,false);
			}
		}
	],function(err,data){
		next(data);
	})
}
/*End: event_details*/