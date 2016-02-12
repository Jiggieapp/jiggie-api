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