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