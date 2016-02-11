require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var request = require('request');

var HashidsNPM = require("hashids");
var Hashids = new HashidsNPM("bfdlkKjlKBKJBjkbk08y23h9hek",12,"1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");



exports.index = function(req, res){
	req.app.get("helpers").logging("request","get","",req);
	
	get_data(req,function(data){
		if(data == 0){
			res.json({code_error:204})
		}else{
			res.json(data);
		}
	})
};

function get_data(req,next){
	var event_id = req.params.event_id;
	
	async.waterfall([
		function get_eventdetails(cb){
			events_detail_coll.findOne({_id:new ObjectId(event_id)},function(err,r){
				if(err){
					cb(null,0);
				}else{
					if(r != null){
						if(r.fullfillment_type == 'ticket'){
							cb(null,1);
						}else{
							cb(null,0);
						}
					}else{
						cb(null,2);
					}
				}
			})
		},
		function get_ticket(cek,cb){
			if(cek == 1){
				tickettypes_coll.find({event_id:event_id}).toArray(function(err,r){
					if(r.length > 0){
						var json_data = new Object();
						json_data.purchase = []
						json_data.reservation = []
						var n = 0;
						async.forEachOf(r,function(v,k,e){
							if(v.ticket_type == 'purchase'){
								json_data.purchase[n] = new Object();
								json_data.purchase[n].ticket_id = v._id;
								json_data.purchase[n].event_id = v.event_id;
								json_data.purchase[n].name = v.name;
								json_data.purchase[n].ticket_type = v.ticket_type;
								json_data.purchase[n].quantity = v.quantity;
								json_data.purchase[n].total_price = v.total;
								n++;
							}else if(v.ticket_type == 'reservation'){
								json_data.reservation[n] = new Object();
								json_data.reservation[n].ticket_id = v._id;
								json_data.reservation[n].event_id = v.event_id;
								json_data.reservation[n].name = v.name;
								json_data.reservation[n].ticket_type = v.ticket_type;
								json_data.reservation[n].quantity = v.quantity;
								json_data.reservation[n].total_price = v.total;
								n++;
							}
						})
						cb(null,json_data);
					}else{
						cb(null,0)
					}
				})
			}else{
				cb(null,0);
			}
		}
	],function(err,merge){
		next(merge);
	})
	
	
}


exports.post_summary = function(req,res){
	get_summary(req,function(data){
		if(data == false){
			res.json({code_error:403})
		}else{
			res.json(data);
		}
	})
}

function get_summary(req,next){
	async.waterfall([
		function post(cb){
			post_summary(req,function(data){
				if(data == false){
					cb(null,false);
				}else{
					cb(null,data)
				}
			})
		},
		function get(data,cb){
			if(data == false){
				cb(null,false)
			}else{
				cb(null,data)
			}
		}
	],function(err,merge){
		next(merge)
	})
}

function post_summary(req,next){
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	var post = req.body;
	
	async.waterfall([
		function syncdata(cb){
			var json_data = new Object();
	
			json_data.code = String(Hashids.encode(new Date().getTime()));
			json_data.status = 'summary';
			json_data.fb_id = post.fb_id;
			json_data.event_id = post.event_id;
			
			var n = 0;
			var totall = 0;
			json_data.product_list = [];
			async.forEachOf(post.product_list,function(v,k,e){
				json_data.product_list[n] = new Object();
				json_data.product_list[n].ticket_id = String(v.ticket_id);
				json_data.product_list[n].name = String(v.name);
				json_data.product_list[n].ticket_type = String(v.ticket_type);
				json_data.product_list[n].total_price = String(v.total_price);
				json_data.product_list[n].num_buy = String(v.num_buy);
				json_data.product_list[n].total_price_all = String(parseFloat(v.num_buy) * parseFloat(v.total_price));
				
				totall += parseFloat(v.num_buy) * parseFloat(v.total_price);
				n++;
			})
			json_data.total_price = String(totall);
			cb(null,json_data);
		},
		function cek(json_data,cb){
			var cek_exist = true;
			var cek_quantity = true;
			var cek_type = true;
			
			var n = 0;
			var in_ticketid = [];
			var temp_type = post.product_list[0].ticket_type;
			var temp_quantity = [];
			async.forEachOf(post.product_list,function(v,k,e){
				if(temp_type != v.ticket_type){
					cek_type = false
				}
				in_ticketid[n] = new ObjectId(v.ticket_id);
				temp_quantity[v.ticket_id] = v.num_buy;
				n++;
			})
			
			tickettypes_coll.find({_id:{$in:in_ticketid}}).toArray(function(err,dt){
				if(err){
					debug.log(err);
					cb(null,[],false,false,false)
				}else{
					if(dt.length > 0){
						async.forEachOf(dt,function(v,k,e){
							if(v.quantity <= temp_quantity[v._id]){
								cek_quantity = false;
							}
						})
					}else{
						cek_exist = false;
					}
					
					cb(null,json_data,cek_exist,cek_quantity,cek_type)
				}
			})
			
			
		},
		function post_data(json_data,cek_exist,cek_quantity,cek_type,cb){
			debug.log(cek_exist);
			debug.log(cek_quantity);
			debug.log(cek_type);
			if(cek_exist == true && cek_quantity == true && cek_type == true){
				var insert = new order(json_data);
				insert.save(function(err){
					if(err){debug.log(err);}else{
						cb(null,json_data)
					}
				})
			}else{
				cb(null,false);
			}
		}
		
	],function(err,merge){
		next(merge);
	})
}
