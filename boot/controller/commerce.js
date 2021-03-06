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
	
	var static_event_id = '56b1a0bf89bfed03005c50f0'
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var options = {
				url : url+"/app/v3/product/list/"+req.params.event_id
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else if(req.params.event_id == static_event_id){
						res.status(400).send({});
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
	});
}

exports.post_summary = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/app/v3/product/summary",
				form : post
			}
			curl.post(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					console.log(json_data)
					if(typeof json_data.code_error != 'undefined'){
						var obj_err = new Object();
						obj_err.response = 0;
						obj_err.msg = json_data.msg;
						obj_err.type = json_data.type;
						res.send(obj_err);
					}else{
						hr.data = new Object();
						hr.data.product_summary = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.term = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
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
		}
	});
}

exports.payment = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
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
						var obj_err = new Object();
						obj_err.response = 0;
						obj_err.msg = json_data.msg;
						obj_err.type = json_data.type;
						console.log(obj_err)
						res.send(obj_err);
					}else{
						hr.data = new Object();
						hr.data.payment_informations = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.cc_info = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
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
		}
	});
}

exports.post_cc = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var options = {
				url : url+"/post_cc/",
				form:req.body
			}
			curl.post(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.post_cc = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.delete_cc = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var options = {
				url : url+"/delete_cc/",
				form:req.body
			}
			curl.post(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.delete_cc = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.notifications_handler = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
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
		}
	});
}

exports.order_list = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
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
		}
	});
}

exports.success_screen = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/success_screen/"+req.params.order_id,
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.success_screen = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.walkthrough_payment = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/walkthrough_payment"
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.walkthrough_payment = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.get_paymentmethod = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/app/v3/product/payment_method"
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.paymentmethod = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.support = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/app/v3/product/support"
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.support = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.forward_mail = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	var options = {
		url : "http://127.0.0.1:31456/forward_support/",
		form:req.body
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.forward_mail = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	});
		
}

exports.guest_info = function(req,res){
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
				url : url+"/app/v3/product/guest_info/"+req.params.fb_id
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.guest_detail = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		// }
	// });
}

exports.free_charge = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/app/v3/product/free_payment",
				form : post
			}
			curl.post(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						var obj_err = new Object();
						obj_err.response = 0;
						obj_err.msg = json_data.msg;
						obj_err.type = json_data.type;
						console.log(obj_err)
						res.send(obj_err);
					}else{
						hr.data = new Object();
						hr.data.payment_informations = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.handle_cancel_vt = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/handle_cancel_vt",
		form : JSON.stringify(post)
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			hr.data = new Object();
			hr.data.notif_vt = JSON.parse(body);
			res.send(hr);
			
		}else{
			res.send(err);
		}
	});
}

exports.invite = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/app/v3/credit/invite",
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
						hr.data.invite = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.invite_all = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/app/v3/credit/invite_all",
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
						hr.data.invite_all = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.contact = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			console.log(post)
			var options = {
				url : url+"/app/v3/credit/contact",
				form: post
			}
			curl.post(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.invite_code = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var options = {
				url : url+"/app/v3/credit/invite_code/"+req.params.fb_id
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.invite_code = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.redeem_code = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var post = req.body;
			var options = {
				url : url+"/app/v3/credit/redeem_code",
				form: post
			}
			curl.post(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						
						if(typeof json_data.is_check == 'undefined'){
							hr.data = new Object();
							hr.data.redeem_code = JSON.parse(body);
							res.send(hr);
						}else{
							var nobj = new Object();
							if(json_data.is_check == true){
								nobj.response = 1;
							}else{
								nobj.response = 0;
							}
							nobj.data = new Object();
							nobj.data.redeem_code = JSON.parse(body);
							res.send(nobj)
						}
						
						
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}

exports.balance_credit = function(req,res){
	var head = req.headers;
	var token = head.authorization;
	
	jwt.verify(token,datakey,function(err,decode){
		if(err){
			if(err.name == 'JsonWebTokenError'){
				res.status(401).send({});
			}else if(err.name == 'TokenExpiredError'){
				res.status(410).send({});
			}
		}else{
			var options = {
				url : url+"/app/v3/credit/balance_credit/"+req.params.fb_id
			}
			curl.get(options,function(err,resp,body){
				if (!err && resp.statusCode == 200) {
					res.header("Content-type","application/json");
					var json_data = JSON.parse(body);
					if(typeof json_data.code_error != 'undefined'){
						res.status(json_data.code_error).send({});
					}else{
						hr.data = new Object();
						hr.data.balance_credit = JSON.parse(body);
						res.send(hr);
					}
				}else{
					res.send(err);
				}
			});
		}
	});
}