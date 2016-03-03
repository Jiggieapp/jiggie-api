var async = require('async');
var url = "http://127.0.0.1:31456";
var curl = require('request');

var hr = new Object();
hr.response = 1;
hr.msg = "success";

exports.index = function(req,res){
	var options = {
		url : url+"/auto_notif"
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				res.send(json_data);
			}
		}else{
			res.send(err);
		}
	})
}