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
	get_data(req,function(data){
		res.json(data);
	})
	
};

function get_data(req,next){
	var codeid = req.params.codeid;
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
	async.waterfall([
		function get_orderlist(){
			
		},
		function get_ticket(){
			
		}
	],function(){
		
	})
	
	order.findOne({code:codeid,status:'summary'},function(err,r){
		delete r.__v;
		delete r.status;
		
		var dt = new Object();
		dt.code = r.code;
		dt.fb_id = r.fb_id;
		dt.event_id = r.event_id;
		dt.total_price = r.total_price;
		dt.product_list = r.product_list;
		dt.created_at = r.created_at;
		
		next(dt);
	})
}

exports.termagreement = function(req,res){
	var code = req.params.codeid;
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	async.waterfall([
		function get_ticketid(cb){
			order.findOne({code:code},function(err,r){
				if(err){
					cb(null,false,401)
				}else{
					var in_ticketid = [];
					var n = 0;
					async.forEachOf(r.product_list,function(v,k,e){
						in_ticketid[n] = new ObjectId(v.ticket_id);
						n++;
					})
					cb(null,true,in_ticketid);
				}
			})
		},
		function get_termconfirmation(state,data,cb){
			if(state == true){
				tickettypes_coll.find({_id:{$in:data}}).toArray(function(err,r){
					if(err){
						debug.log('errs')
						cb(null,false,401);
					}else{
						if(r.length > 0){
							var term_arr = [];
							var n = 0;
							async.forEachOf(r,function(v,k,e){
								if(v.purchase_confirmations.length > 0 && typeof v.purchase_confirmations != 'undefined'){
									term_arr[n] = new Object();
									term_arr[n].ticket_id = v._id;
									term_arr[n].term = v.purchase_confirmations;
									n++;
								}
							})
							if(term_arr.length > 0){
								cb(null,true,term_arr)
							}else{
								debug.log('purchase confirmation empty')
								cb(null,false,204)
							}
							
						}else{
							debug.log('data empty')
							cb(null,false,401)
						}
						
					}
				})
			}else{
				debug.log('errs')
				cb(null,false,data);
			}
		}
	],function(err,state,data){
		if(state == false){
			res.json({code_error:data});
		}else{
			if(typeof data == 'undefined'){
				res.json({code_error:401});
			}else{
				res.json(data)
			}
		}
		
	})
	
}