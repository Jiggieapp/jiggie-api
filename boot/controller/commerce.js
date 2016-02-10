var async = require('async');
var url = "http://127.0.0.1:24534";
var curl = require('request');
var jwt = require('jsonwebtoken');
var datakey = 'Wk0rXZTxsesP99giBjIm12Vbq8nPbW4chfudbcAdmindjjJannesSantoso123JJJjklsqiiSecretDataKey90909087869';

var hr = new Object();
hr.response = 1;
hr.msg = "success";

exports.index = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	// jwt.verify(token,datakey,function(err,decode){
		// if(err){
			// if(err.name == 'JsonWebTokenError'){
				// res.status(401).send({});
			// }else if(err.name == 'TokenExpiredError'){
				// res.status(410).send({});
			// }
		// }else{
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
		// }
	// });
	
	
}