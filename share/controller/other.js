require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');

exports.getshare = function(req, res){
	getshare(req,function(data){
		res.json(data)
	})
}

function getshare(req,next){
	var fb_id = req.params.fb_id;
	var cond = {
		"appsflyer.af_sub1":fb_id
	}
	
	async.waterfall([
		function get_customers(cb){
			customers_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log("error line 21 other share");
					debug.log(err)
					cb(null,[],false);
				}else{
					if(r == null || typeof r == 'undefined' || r.length == 0){
						debug.log("data empty");
						cb(null,[],false);
					}else{
						cb(null,r,true)
					}
				}
			})
		},
		function sync_data(rcust,stat,cb){
			if(stat == true){
				var json_data = new Object();
				json_data.total = rcust.length;
				
				json_data.list = [];
				var n = 0;
				async.forEachOf(rcust,function(v,k,e){
					json_data.list[n] = new Object();
					json_data.list[n].fullname = v.first_name+' '+v.last_name;
					json_data.list[n].email = v.email;
					json_data.list[n].appsflyer = v.appsflyer;
					json_data.list[n].url_admin = 'https://admin.jiggieapp.com/admin/user/users/#/details='+v.fb_id;
					n++;
				})
				cb(null,true,json_data)
			}else{
				cb(null,false,[])
			}
		}
	],function(err,stat,merge){
		if(stat == false){
			next({code_error:403})
		}else{
			next(merge);
		}
	})
	
}

