var async = require('async');
var url = "http://127.0.0.1:16523";
var curl = require('request');

exports.index = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/apn",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			res.send({success:true});
		}else{
			res.send(err);
		}
	})
}

exports.all = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/apn_all",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			res.send({success:true});
		}else{
			res.send(err);
		}
	})
}

exports.th = function(req,res){
	var options = {
		url : 'http://127.0.0.1:42314/tribehired'
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.send(body);
		}else{
			res.send(err);
		}
	})
}

exports.th_nextround = function(req,res){
	var post = req.body;
	var options = {
		url : 'http://127.0.0.1:42314/do_roll',
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.send(body);
		}else{
			res.send(err);
		}
	})
}