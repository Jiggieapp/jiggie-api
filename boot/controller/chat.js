var async = require('async');
var url = "http://127.0.0.1:10110";
var curl = require('request');

var hr = new Object();
hr.response = 1;
hr.msg = "success";

exports.list = function(req,res){
	var fb_id = req.param("fb_id");
	var options = {
		url : url+"/app/v3/conversations?fb_id="+fb_id
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.chat_lists = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.conversation = function(req,res){
	var fb_id = req.params.fb_id;
	var member_fb_id = req.params.member_fb_id;
	var options = {
		url : url+"/app/v3/chat/conversation/"+fb_id+"/"+member_fb_id
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.chat_conversations = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.post_message = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/messages/add",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var rsp = {
				response : 1,
				msg : 'Success',
				data: body
			}
			res.send(rsp);
		}else{
			res.send(err);
		}
	})
}

exports.remove_listchat = function(req,res){
	var from_id = req.param('fromId');
	var to_id = req.param('toId');
	var options = {
		url : url+"/app/v3/deletemessageswithfbid?fromId="+from_id+"&toId="+to_id
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
	})
}

exports.block_listchat = function(req,res){
	var from_id = req.param('fromId');
	var to_id = req.param('toId');
	var options = {
		url : url+"/app/v3/blockuserwithfbid?fromId="+from_id+"&toId="+to_id
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
	})
}