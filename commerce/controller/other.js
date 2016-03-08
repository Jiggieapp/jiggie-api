require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');

exports.cc_info = function(req,res){
	get_ccinfo(req,function(stat,data){
		if(stat == true){
			res.json(data);
		}else{
			res.json({code_error:403});
		}
	})
}

function get_ccinfo(req,next){
	var fb_id = req.params.fb_id;
	
	async.waterfall([
		function get_customers(cb){
			customers_coll.findOne({fb_id:fb_id},function(err,r){
				if(err){
					debug.log('error data line 21=>otherjs commerce')
					cb(null,false,[]);
				}else{
					if(r == null){
						debug.log('data customers null=>others commerce');
						cb(null,false,[]);
					}else{
						cb(null,true,r);
					}
				}
			})
		},
		function get_ccinfo(stat,rc,cb){
			if(stat == true){
				if(rc.cc_info == null || typeof rc.cc_info == 'undefined'){
					debug.log('Error Data 36=>other.js=>commerce');
					cb(null,false,[]);
				}else{
					cb(null,true,rc.cc_info);
				}
			}else{
				debug.log('Error Data 42=>other.js=>commerce');
				cb(null,false,[]);
			}
		}
	],function(err,stat,data){
		try{
			if(stat == true){
				next(true,data)
			}else{
				debug.log('error line 51-> otherjs->commerce')
				next(false,[]);
			}
		}catch(e){
			debug.log(e);
			next(false,[]);
		}
	})
	
}

exports.order_list = function(req,res){
	orderlist(req,function(stat,data){
		if(stat == false){
			res.json({code_error:403});
		}else{
			res.json(data);
		}
	})
}

function orderlist(req,next){
	var fb_id = req.params.fb_id;
	async.waterfall([
		function get_order(cb){
			order_coll.find({fb_id:fb_id}).toArray(function(err,r){
				if(err){
					debug.log('error otherjs commerce line 71');
					debug.log(err);
					cb(null,false,[]);
				}else{
					cb(null,true,r)
				}
			})
		},
		function get_event(stat,dt_order,cb){
			if(stat == true){
				var in_eventid = [];
				var n = 0;
				async.forEachOf(dt_order,function(v,k,e){
					in_eventid[n] = new ObjectId(v.event_id);
					n++;
				})
				events_detail_coll.find({_id:{$in:in_eventid}}).toArray(function(err,r){
					if(err){
						debug.log('err lone 101 commerce other');
						debug.log(err);
						cb(null,false,[],[]);
					}else{
						cb(null,true,dt_order,r)
					}
				})
			}else{
				cb(null,false,[],[]);
			}
		},
		function sync_data(stat,dt_order,dt_event,cb){
			if(stat == true){
				var json_data = [];
				var n = 0;
				async.forEachOf(dt_order,function(v,k,e){
					delete v.vt_response;
					delete v.__v;
					delete v.mail_status;
					async.forEachOf(dt_event,function(ve,ke,ee){
						delete ve.guests_viewed;
						delete ve.viewed;
						if(v.event_id == ve._id){
							json_data[n] = new Object();
							json_data[n].order = v;
							json_data[n].event = ve;
							n++;
						}
					})
				})
				cb(null,true,json_data);
			}else{
				cb(null,false,[]);
			}
		}
	],function(err,stat,data){
		try{
			if(stat == true){
				next(true,data);
			}else{
				next(false,[]);
			}
		}catch(e){
			debug.log('error lone 115 commerce other')
			debug.log(e);
			next(false,[]);
		}
	})
}