require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');


exports.list = function(req, res){
	req.app.get("helpers").logging("request","get","",req);
	
	var fb_id = req.param("fb_id");
	
	customers_coll.findOne({fb_id:fb_id},function(errs,cek_fbid){
		if(cek_fbid == undefined){
			// 403 => Invalid ID
			res.json({code_error:403})
		}else{
			get_data(req,fb_id,function(data){
				if(data.length == 0){
					res.json({code_error:204})
				}else{
					res.json(data);
				}
			});
		}
	})
	
	
	
};

function get_data(req,fb_id,next){
	async.parallel([
		function getdata(cb){
			get_chatlist(req,fb_id,function(data){
				cb(null,data);
			})
		},
		function clean_data(cb){
			cleandata(fb_id,function(dtu){})
			cb(null,1);
		}
	],function(err,merge){
		next(merge[0]);
	})
}

function cleandata(fb_id,next){
	chatmessages_coll.find({fb_id:fb_id}).toArray(function(err,r){
		if(r.length > 1){
			var data_to_push = r[0];
			async.waterfall([
				function step1(cb){
					chatmessages_coll.remove({fb_id:fb_id},function(err,del){
						if(err){debug.log(err);}else{
							cb(null,1)
						}
					})
				},
				function step2(dt,cb){
					chatmessages_coll.insert(data_to_push,function(err,ins){
						if(err){debug.log(err)}
					})
					cb(null,true)
				}
			],function(err,mgg){
				next(mgg);
			})
		}else{
			next(true)
		}
	})
}

function get_chatlist(req,fb_id,next){
	chatmessages_coll.findOne({fb_id:fb_id},function(err,rows){
		var json_data = [];
		var n = 0;
		if(rows != undefined){
			if(typeof rows.conversations != 'undefined'){
				async.forEachOf(rows.conversations,function(v,k,e){
					if(v.block == true || v.delete == true || typeof v.event_id == 'undefined'){
						debug.log("jgn munculin");
					}else{
						json_data[n] = new Object();
						json_data[n].fromId = v.fromId;
						json_data[n].fromName = v.fromName;
						if(v.profile_image == ""){
							json_data[n].profile_image = "https://graph.facebook.com/"+v.fb_id+"/picture?width=1000&height=1000"
						}else{
							json_data[n].profile_image = v.profile_image;
						}
						json_data[n].last_message = v.last_message;
						json_data[n].last_updated = v.last_updated;
						json_data[n].unread = parseInt(v.unread);
						json_data[n].fb_id = v.fb_id;
						json_data[n].hasreplied = v.hasreplied;
						n++;
					}
				});
				if(json_data.length > 0){json_data = json_data.sort(sortDate);}
			}
		}
		next(json_data);
	});
}

// sort desc by last_updated Date
var sortDate = function (a, b){
	if(a.last_updated == undefined)
	{
		a.last_updated = new Date(2000,0,1);
	}
	if(b.last_updated == undefined)
	{
		b.last_updated = new Date(2000,0,1);
	}
	if (a.last_updated < b.last_updated) return 1;
	if (a.last_updated > b.last_updated) return -1;
	return 0;
}



exports.remove = function(req,res){
	req.app.get("helpers").logging("request","get","",req);
	var from_id = req.param('fromId');
	var to_id = req.param('toId');
		
	var cond = {
		fb_id:from_id,
		"conversations.fb_id":to_id
	}
	var json_form = {
		$set:{
			"conversations.$.delete":true
		}
	}
	chatmessages_coll.update(cond,json_form,function(err,upd){
		if(upd){
			res.json({success:true});
		}else{
			res.json({success:false});
		}
	})
}

exports.block = function(req,res){
	var from_id = req.param('fromId');
	var to_id = req.param('toId');
	async.parallel([
		function socfed(cb){
			async_block_socialfeedcols(req,from_id,to_id,function(upd){
				cb(null,upd)
			})
		},
		function other(cb){
			async_block_chatcols(req,from_id,to_id,function(upd){
				cb(null,upd)
			})
		},
	],function(err,upd){
		if(upd){
			res.json({success:true});
		}
	})
}

function async_block_chatcols(req,from_id,to_id,next) {
	async.parallel([
		function self(cb){
			var cond = {
				fb_id:from_id,
				"conversations.fb_id":to_id
			}
			var json_form = {
				$set:{
					"conversations.$.block":true
				}
			}
			chatmessages_coll.update(cond,json_form,function(err,upd){
				if(err){
					debug.log(err)
					req.app.get("helpers").logging("error","get","list.js line 120 "+String(err),req);
				}else{
					cb(null,"next");
				}
			})
		},
		function other(cb){
			var cond = {
				fb_id:to_id,
				"conversations.fb_id":from_id
			}
			var json_form = {
				$set:{
					"conversations.$.block":true
				}
			}
			chatmessages_coll.update(cond,json_form,function(err,upd){
				if(err){
					debug.log(err)
					req.app.get("helpers").logging("error","get","list.js line 139 "+String(err),req);
				}else{
					cb(null,"next");
				}
			})
		}
	],function(err,upd){
		next(upd);
	})
}

function async_block_socialfeedcols(req,from_id,to_id,next){
	async.parallel([
		function self(cb){
			var cond = {
				fb_id:from_id,
				'users.fb_id':to_id
			}
			var form_json = {
				$set:{
					'users.$.from_state':'denied',
					'users.$.to_state':'denied'
				}
			}
			socialfeed_coll.update(cond,form_json,function(err,upd){
				if(err){
					debug.log(err)
					req.app.get("helpers").logging("error","get","list.js line 117 "+String(err),req);
				}else{
					cb(null,"next");
				}
			})
		},
		function other(cb){
			var cond = {
				fb_id:to_id,
				'users.fb_id':from_id
			}
			var form_json = {
				$set:{
					'users.$.from_state':'denied',
					'users.$.to_state':'denied'
				}
			}
			socialfeed_coll.update(cond,form_json,function(err,upd){
				if(err){
					debug.log(err)
					req.app.get("helpers").logging("error","get","list.js line 137 "+String(err),req);
				}else{
					cb(null,"next");
				}
			})
		}
	],function(err,upd){
		next(upd);
	})
}