require('./../models/emit');
var debug = require('./../config/debug');
var cache = require('./../config/cache');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var fs = require('fs')



exports.index = function(req, res){
	var fb_id = req.params.fb_id;
	var key_id = req.params.id;
	
	customers_coll.findOne({fb_id:fb_id},function(err,r){
		if(!err && r != null){
			var img_url = r.photos[key_id]
			debug.log(img_url)
			
			request
			.get(img_url)
			.on('response', function(response) {
				console.log(response.statusCode) // 200
				console.log(response.headers['content-type']) // 'image/png'
				
			  })
			.pipe(res);
		}
	})
};

exports.preload_profile = function(req,res){
	customers_coll.find({}).toArray(function(err,r){
		if(!err && r.length > 0){
			async.forEachOf(r,function(v,k,e){
				if(typeof v.photos != 'undefined'){
					async.forEachOf(v.photos,function(ve,ke,ee){
						var url_def = 'http://img.jiggieapp.com/image/'+v.fb_id+'/'+ke+'/?imgid='+ve
						var options = {
							url:url_def
						}
						request.get(options,function(err,resp,body){
							debug.log(url_def)
							debug.log(resp.statusCode)
						})
					})
				}
			})
		}
	})
	res.json({success:true})
}