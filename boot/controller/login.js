var async = require('async');
var url = "http://127.0.0.1:1234";
var curl = require('request');

var hr = new Object();
hr.response = 1;
hr.msg = "success";

exports.index = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/login",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			res.send(body);
		}else{
			res.send(err);
		}
	})
}

exports.sync_membersettings = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/membersettings",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			res.send(body);
		}else{
			res.send(err);
		}
	})
}

exports.sync_mixpanel = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/user/sync/superproperties/:fb_id",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			res.send(body);
		}else{
			res.send(err);
		}
	})
}

exports.sync_appsflyer = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/appsflyerinfo",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			res.send(body);
		}else{
			res.send(err);
		}
	})
}

exports.membersettingsGet = function(req,res){
	var fb_id = req.param('fb_id');
	
	var options = {
		url : url+'/app/v3/membersettings?fb_id='+fb_id
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			res.send(body);
		}else{
			res.send(err);
		}
	})
}

exports.memberinfo = function(req,res){
	var fb_id = req.params.fb_id;
	
	var options = {
		url : url+'/app/v3/memberinfo/'+fb_id
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.memberinfo = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.sync_about = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/updateuserabout",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.userlogin = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/userlogin",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(json_data);
			}
		}else{
			res.send(err);
		}
	})
}