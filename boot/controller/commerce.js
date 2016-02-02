var async = require('async');
var url = "http://127.0.0.1:24534";
var curl = require('request');

var hr = new Object();
hr.response = 1;
hr.msg = "success";

exports.index = function(req,res){
	var options = {
		url : url+"/app/v3/product/list/"+req.params.event_id
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.product_lists = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	});
}