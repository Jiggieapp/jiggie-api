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
	var post = req.body;
	var fb_id = post.fb_id;
	
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