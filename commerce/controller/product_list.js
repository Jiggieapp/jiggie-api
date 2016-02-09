require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');



exports.index = function(req, res){
	res.json('dsa')
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
						var json_data = [];
						var n = 0;
						async.forEachOf(r,function(v,k,e){
							json_data[n] = new Object();
							json_data[n].ticket_id = v._id;
							json_data[n].event_id = v.event_id;
							json_data[n].name = v.name;
							json_data[n].ticket_type = v.ticket_type;
							json_data[n].quantity = v.quantity;
							json_data[n].total_price = v.total;
							n++;
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
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	var post = req.body;
	
	var ticket_id = String(post.ticket_id);
	var event_id = String(post.event_id);
	var name = String(post.name);
	var ticket_type= String(post.ticket_type);
	var quantity= parseFloat(post.quantity);
	var total_price= parseFloat(post.total_price);
	var num_buy= parseFloat(post.num_buy);
	var total_price_all= parseFloat(post.total_price_all);
	var fb_id= String(post.fb_id);
	
	var data_post = {
		ticket_id:ticket_id,
		event_id:event_id,
		name:name,
		ticket_type:ticket_type,
		quantity:quantity,
		total_price:total_price,
		num_buy:num_buy,
		total_price_all:total_price_all,
		fb_id:fb_id,
	}
	
	var insert = new order(data_post);
	insert.save(function(err){
		if(err){debug.log(err);}
	})
	res.send(1)
}
