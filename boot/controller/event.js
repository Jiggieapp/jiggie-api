var async = require('async');
var url = "http://127.0.0.1:11223";
var curl = require('request');

var hr = new Object();
hr.response = 1;
hr.msg = "success";



exports.index = function(req,res){
	
	var options = {
		url : url+"/app/v3/events/list/"+req.params.fb_id
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.events = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	});
}

exports.details = function(req,res){
	var options = {
		url : url+"/app/v3/event/details/"+req.params.event_id+"/"+req.params.fb_id+"/"+req.params.gender_interest
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.event_detail = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	});
}

exports.interest = function(req,res){
	var options = {
		url : url+"/app/v3/event/interest/"+req.params.event_id+"/"+req.params.fb_id+"/"+req.params.gender_interest
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.guest_interests = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	});
}

exports.match = function(req,res){
	var options = {
		url : url+"/app/v3/partyfeed/match/"+req.params.fb_id+"/"+req.params.guest_fb_id+'/approved'
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var rsp = {
				response : 1,
				msg : 'Success'
			}
			res.send(rsp);
		}else{
			res.send(err);
		}
	});
}