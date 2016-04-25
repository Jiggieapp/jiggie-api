var async = require('async');
var url = "http://127.0.0.1:15684";
var curl = require('request');

var hr = new Object();
hr.response = 1;
hr.msg = "success";

exports.venue = function(req,res){
	var post = req.body
	var options = {
		url : url+"/admin/venue",
		form:post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.admin_venue = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.admin_event = function(req,res){
	var post = req.body
	var options = {
		url : url+"/admin/event",
		form:post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.admin_event = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}