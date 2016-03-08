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

exports.post_summary = function(req,res){
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
			var post = req.body;
			var options = {
				url : url+"/app/v3/product/summary",
				form : post
			}
			curl.post(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.product_summary = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		// }
	// });
}

exports.term = function(req,res){
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
				url : url+"/app/v3/product/term/"+req.params.codeid
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.terms = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		// }
	// });
}

exports.payment = function(req,res){
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
			var post = req.body;
			var options = {
				url : url+"/app/v3/product/payment",
				form : post
			}
			curl.post(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.payment_informations = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		// }
	// });
}

exports.cc_info = function(req,res){
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
				url : url+"/credit_card/"+req.params.fb_id
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.creditcard_informations = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		// }
	// });
}

exports.notifications_handler = function(req,res){
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
			var post = req.body;
			var options = {
				url : url+"/notif_handle/",
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.notifications_handler = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		// }
	// });
}

exports.order_list = function(req,res){
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
			var post = req.body;
			var options = {
				url : url+"/order_list/"+req.params.fb_id,
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.order_lists = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		// }
	// });
}