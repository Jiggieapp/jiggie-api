require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');

exports.do_like = function(req, res){
	do_like(req,function(dt){
		res.json(dt)
	})
};

function do_like(req,next){
	var event_id = req.params.event_id;
	var fb_id = req.params.fb_id;
	var likes = req.params.likes
	
	async.waterfall([
		function get_event(cb){
			events_detail_coll.findOne({_id:new ObjectId(event_id)},function(err,r){
				if(err){
					cb(null,false,[])
				}else{
					if(r == null){
						cb(null,false,[])
					}else{
						cb(null,true,r)
					}
				}
			})
		},
		function get_cust(stat,rows_event,cb){
			if(stat == true){
				customers_coll.findOne({fb_id:fb_id},function(err,r){
					if(err){
						cb(null,false,[],[])
					}else{
						if(r == null){
							cb(null,false,[],[])
						}else{
							cb(null,true,rows_event,r)
						}
					}
				})
			}else{
				cb(null,false,[],[])
			}
		},
		function cek_isexist(stat,rows_event,rows_cust,cb){
			if(stat == true){
				var cond = {
					_id:new ObjectId(event_id),
					"likes.fb_id":fb_id
				}
				events_detail_coll.findOne(cond,function(err,r){
					if(err){
						cb(null,false,false,[],[])
					}else{
						if(r == null){
							cb(null,true,false,rows_event,rows_cust)
						}else{
							debug.log('fb_id already likes event')
							cb(null,true,true,[],[])
						}
					}
				})
			}else{
				cb(null,false,false,[],[])
			}
		},
		function upd_event(stat,fbid_exist,rows_event,rows_cust,cb){
			if(stat == true){
				if(likes == 'yes'){
					if(fbid_exist == false){
						var cond = {
							_id:new ObjectId(event_id)
						}
						var form_upd = {
							$push:{
								'likes':{
									fb_id:fb_id,
									gender:rows_cust.gender
								}
							}
						}
						events_detail_coll.update(cond,form_upd,function(err,upd){
							if(err){
								debug.log(err)
								debug.log('error line 88 likes event')
								cb(null,false,[],[])
							}else{
								cb(null,true,rows_event,rows_cust)
							}
						})
					}else{
						cb(null,false,[],[])
					}
				}else if(likes == 'no'){
					if(fbid_exist == true){
						var cond = {
							_id:new ObjectId(event_id),
							"likes.fb_id":fb_id
						}
						var form_upd = {
							$pull:{
								'likes':{
									fb_id:fb_id
								}
							}
						}
						events_detail_coll.update(cond,form_upd,function(err,upd){
							if(err){
								debug.log(err)
								debug.log('error line 109 likes event')
								cb(null,false,[],[])
							}else{
								cb(null,true,rows_event,rows_cust)
							}
						})
					}else{
						cb(null,false,[],[])
					}
				}
			}else{
				cb(null,false,[],[])
			}
		},
		function upd_cust(stat,rows_event,rows_cust,cb){
			if(stat == true){
				if(likes == 'yes'){
					customers_coll.update({fb_id:fb_id},{
						$push:{
							'likes_event':{
								event_id:rows_event._id
							}
						}
					},function(err,upd){
						if(err){
							debug.log(err);
							debug.log('error line 107')
							cb(null,false)
						}else{
							cb(null,true)
						}
					})
				}else if(likes == 'no'){
					customers_coll.update({fb_id:fb_id,"likes_event.event_id":rows_event._id},{
						$pull:{
							'likes_event':{
								event_id:rows_event._id
							}
						}
					},function(err,upd){
						if(err){
							debug.log(err);
							debug.log('error line 148')
							cb(null,false)
						}else{
							cb(null,true)
						}
					})
				}
			}else{
				cb(null,false)
			}
		}
	],function(err,merge){
		if(merge == true){
			next({success:true})
		}else if(merge == false){
			next({code_error:403})
		}
	})
	
}
