require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');

var comurl = 'http://54.169.78.162/VT/examples/';

exports.index = function(req, res){
	post_transaction_cc(req,function(dt){
		res.send(dt);
	})
	
};

function post_transaction_cc(req,next){
	var post = req.body;
	var order_id = post.order_id;
	var token_id = post.token_id;
	var save_cc = post.save_cc;
	(parseInt(save_cc) == 1) ? save_cc = true : save_cc = false;
	
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
	async.waterfall([
		function get_order(cb){
			order.findOne({order_id:order_id},function(err,r){
				if(err){
					debug.log("error get order product data")
					cb(null,false,{code_error:401})
				}else{
					if(r == null){
						debug.log("order product data null")
						cb(null,false,{code_error:403})
					}else{
						cb(null,true,r);
					}
				}
			})
		},
		function get_customers(stat,dt,cb){
			if(stat == false){
				cb(null,false,dt,[])
			}else if(stat == true){
				customers_coll.findOne({fb_id:dt.fb_id},function(err,r){
					if(err){
						debug.log("error get customers data")
						cb(null,false,{code_error:401},[])
					}else{
						if(r == null){
							debug.log("customers data null");
							cb(null,false,{code_error:403},[])
						}else{
							cb(null,true,dt,r);
						}
					}
				})
			}
		},
		function sync_data(stat,dt,dt2,cb){
			if(stat == true){
				var json_data = new Object();
				
				// s:transaction_details //
				transaction_details = new Object();	
				transaction_details.order_id = order_id;
				transaction_details.gross_amount = parseFloat(dt.total_price);
				json_data.transaction_details = transaction_details;
				// e:transaction_details //
				
				// s:items //
				var items = [];
				var n = 0;
				async.forEachOf(dt.product_list,function(v,k,e){
					items[n] = new Object();
					items[n].id = v.ticket_id;
					items[n].price = parseInt(v.total_price);
					items[n].quantity = parseInt(v.num_buy);
					items[n].name = v.name;
				})
				json_data.items = items;
				// e:items //
				
				// s:billing address //
				
				billing_address = new Object();
				billing_address.first_name = dt2.user_first_name;
				billing_address.last_name = dt2.user_last_name;
				// json_data.billing_address.address = dt2.user_first_name;
				// json_data.billing_address.city = dt2.user_first_name;
				// json_data.billing_address.postal_code = dt2.user_first_name;
				// json_data.billing_address.phone = dt2.user_first_name;
				// json_data.billing_address.country_code = dt2.user_first_name;
				json_data.billing_address = billing_address;
				
				// e:billing address //
				
				// s:shipping_address //
				
				shipping_address = new Object();
				shipping_address.first_name = dt2.user_first_name;
				shipping_address.last_name = dt2.user_last_name;
				// json_data.shipping_address.address = dt2.user_first_name;
				// json_data.shipping_address.city = dt2.user_first_name;
				// json_data.shipping_address.postal_code = dt2.user_first_name;
				// json_data.shipping_address.phone = dt2.user_first_name;
				// json_data.shipping_address.country_code = dt2.user_first_name;
				json_data.shipping_address = shipping_address;
				
				// e:shipping_address //
				
				// s:customer_details //
				var customer_details = new Object();
				customer_details.first_name = dt2.user_first_name;
				customer_details.last_name = dt2.user_last_name;
				customer_details.email = dt2.email;
				customer_details.phone = dt2.phone;
				// customer_details.billing_address = billing_address;
				// customer_details.shipping_address = shipping_address;
				json_data.customer_details = customer_details;
				
				// e:customer_details //
				
				// s:transaction_data //
				// json_data.transaction_data = new Object();
				// json_data.transaction_data.payment_type = 'credit_card';
				// json_data.transaction_data.credit_card = new Object();
				// json_data.transaction_data.credit_card.token_id = token_id;
				// json_data.transaction_data.credit_card.bank = 'bni';
				// json_data.transaction_data.credit_card.save_token_id = save_cc;
				// json_data.transaction_data.transaction_details = transaction_details;
				// json_data.transaction_data.item_details = items;
				// json_data.transaction_data.customer_details = customer_details;
				// e:transaction_data //
				
				json_data.token_id = token_id;
				// example token : 401111-1112-c36418e1-0ebd-421a-abf5-a89d38471884 //
				
				var options = {
					url : comurl+'vt-direct/checkout-process2.php',
					form : json_data
				}
				curl.post(options,function(err,resp,body){
					if (!err && resp.statusCode == 200) {
						cb(null,body);
					}else{
						debug.log('error post curl');
						cb(null,{code_error:401});
					}
				});
			}else{
				cb(null,dt);
			}
			
		}
	],function(err,merge){
		next(merge);
	})
}