var url = "http://127.0.0.1:53412";
var curl = require('request');

exports.index = function(req,res){
	var type = req.param('type');
	var from_fb_id = req.param('from_fb_id');
	
	var urli = '';
	if(type == 'general'){
		urli = '/app/v3/invitelink?from_fb_id='+from_fb_id+'&type='+type;
	}else{
		var event_id = req.param('event_id');
		var venue_name = req.param('venue_name');
		urli = '/app/v3/invitelink?event_id='+event_id+'&from_fb_id='+from_fb_id+'&type='+type+'&venue_name='+venue_name;
	}
	
	var options = {
		url : url+urli
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			res.send(body);
		}else{
			res.send(err);
		}
	});
}

exports.parseShareLink = function(req,res){
	var hash_id = req.params.id;
	var options = {
		url:'http://127.0.0.1:53412/lookuplink/'+hash_id
	}
	
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			// res.header("Content-type","application/json");
			res.redirect(body);
		}else{
			res.send(err);
		}
	});
}

exports.showParseShareLink = function(req,res){
	var hash_id = req.params.id;
	var options = {
		url:'http://127.0.0.1:53412/lookuplink/'+hash_id
	}
	
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			// res.header("Content-type","application/json");
			res.redirect(body);
		}else{
			res.send(err);
		}
	});
}

exports.getshare = function(req,res){
	var fb_id = req.params.fb_id;
	var options = {
		url:'http://127.0.0.1:53412/app/v3/getshare/'+fb_id
	}
	
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.share_lists = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	});
}