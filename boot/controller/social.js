var async = require('async');
var url = "http://127.0.0.1:31213";
var curl = require('request');

var hr = new Object();
hr.response = 1;
hr.msg = "success";

exports.index = function(req,res){
	var options = {
		url : url+"/app/v3/partyfeed/list/"+req.params.fb_id+'/'+req.params.gender_interest
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.social_feeds = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	});
}

exports.connect = function(req,res){
	var options = {
		url : url+"/app/v3/partyfeed_socialmatch/match/"+req.params.fb_id+'/'+req.params.member_fb_id+'/'+req.params.match
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

exports.upd_matchme = function(req,res){
	var options = {
		url : url+"/app/v3/partyfeed/settings/"+req.params.fb_id+'/'+req.params.matchme
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