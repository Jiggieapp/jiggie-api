require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');

var comurl = 'https://commerce.jiggieapp.com/VT/examples/';
// var comurl = 'http://127.0.0.1/VT/examples/';

exports.index = function(req, res){
	post_transaction_cc(req,function(dt){
		if(dt == false){
			res.json({code_error:403})
		}else{
			res.json(dt);
		}
	})
};

function post_transaction_cc(req,next){
	var post = req.body;
	var order_id = post.order_id;
	var token_id = post.token_id;
	var type = post.type;
	var save_cc = post.is_new_card;
	var secure_cc = 1;
	
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
					n++;
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
				
				json_data.save_cc = parseInt(save_cc);
				json_data.secure = parseInt(secure_cc);
				
				var options = {
					url : comurl+'vt-direct/checkout-process2.php',
					form : json_data
				}
				curl.post(options,function(err,resp,body){
					if (!err && resp.statusCode == 200) {
						cb(null,true,body)
					}else{
						cb(null,false,[]);
					}
				});
			}else{
				cb(null,dt);
			}
		},
		function merge_data(stat,body,cb){
			if(stat == true){
				debug.log(body);
				var vt = JSON.parse(body);
				if(type == 'cc'){
					var is_new_card = post.is_new_card;
					if(typeof is_new_card != 'undefined'){
						if(String(is_new_card) == '1'){
							if(vt.transaction_status == 'capture'){
								async.waterfall([
									function upd_challenge(cb2){
										if(vt.fraud_status == 'challenge'){
											debug.log('fraud status challenge');
											var form_post = new Object();
											form_post.order_id = order_id
											var options = {
												url : comurl+"/approve.php",
												form : form_post
											}
											curl.post(options,function(err2,response,dt){
												if (!err2 && response.statusCode == 200) {
													var dt = JSON.parse(dt);
													if(typeof dt.code_error != 'undefined'){
														debug.log('error push api approve challange');
														cb2(null,false);
													}else{
														cb2(null,true);
													}
												}else{
													debug.log('error line 189');
													cb2(null,false)
												}
											});
										}else{
											debug.log('fraud status accepted');
											cb(null,true);
										}
									},
									function get_stock(stat,cb2){
										if(stat == true){
											order.findOne({order_id:order_id},function(err,r){
												if(err){
													debug.log('error line 203');
													cb2(null,false,{code_error:403});
												}else{
													// update stock after success buy //
													var num_buy = 0;
													async.forEachOf(r.product_list,function(v,k,e){
														num_buy = v.num_buy;
														tickettypes_coll.findOne({_id:new ObjectId(v.ticket_id)},function(err2,r2){
															var quantity_old = r2.quantity;
															var new_qty = parseInt(quantity_old)-parseInt(num_buy);
															tickettypes_coll.update({_id:new ObjectId(v.ticket_id)}),{$set:{quantity:new_qty}},function(err3,upd){
																if(err3){
																	debug.log('error update stock');
																	cb2(null,false);
																}else{
																	cb2(null,true);
																}
															})
														})
													})
												
												}
											})
										}else if(stat == false){
											cb2(null,false);
										}
									},
									function upd_order(stat,cb2){
										if(stat == true){
											var form_upd = {
												$set:{
													order_status:'pending_shipment',
													payment_status:'paid'
												}
											}
											order.update({order_id:order_id},form_upd,function(err,upd){
												if(err){
													debug.log('error line 165');
													cb2(null,false);
												}else{
													cb2(null,true);
												}
											})
										}else{
											cb2(null,false);
										}
									},
									function upd_cust(stat,cb2){
										if(stat == true){
											var masked_card = vt.masked_card;
											var saved_token_id = vt.saved_token_id;
											var payment_type = vt.payment_type;
											var saved_token_id_expired_at = vt.saved_token_id_expired_at;
											var data_push = {
												masked_card : masked_card,
												saved_token_id : saved_token_id,
												saved_token_id_expired_at : saved_token_id_expired_at,
												payment_type : payment_type
											}
											customers_coll.findOne({fb_id:dt2.fb_id},function(err,r){
												if(r.ccinfo != null || r.ccinfo != undefined){
													if(r.length > 0){
														customers_coll.update({fb_id:dt2.fb_id},{$push:{ccinfo:data_push}},function(err2,upd){
															if(err2){
																debug.log("error update line 172");
																cb2(null,false);
															}else{
																debug.log("updated cc info");
															}
														})
													}else{
														var data_ins = [];
														data_ins[0] = data_push;
														customers_coll.update({fb_id:dt2.fb_id},{$set:{ccinfo:data_ins}},function(err2,upd){
															if(err2){
																debug.log("error update line 181");
																cb2(null,false);
															}else{
																debug.log("updated cc info");
															}
														})
													}
												}else{
													var data_ins = [];
													data_ins[0] = data_push;
													customers_coll.update({fb_id:dt2.fb_id},{$set:{ccinfo:data_ins}},function(err2,upd){
														if(err2){
															debug.log("error update line 192");
															cb2(null,false);
														}else{
															debug.log("updated cc info");
														}
													})
												}
											})
											cb2(null,true);
										}else{
											cb2(null,false);
										}
									},
									function upd_vt(stat,cb2){
										if(stat == true){
											order_coll.update({order_id:order_id},{$set:{vt_response:vt}},function(err,upd){
												if(err){
													debug.log('error line 228');
													cb2(null,false);
												}else{
													cb2(null,true);
												}
											})
										}else{
											cb2(null,false);
										}
									}
								],function(err,merge2){
									if(merge2 == true){
										cb(null,{success:true,status:'capture'});
									}else if(merge2 == false){
										debug.log('error line 255');
										cb(null,{code_error:403});
									}
								})
								
							}else if(vt.transaction_status == 'deny'){
								
							}
						}else if(String(is_new_card) == '0' || String(is_new_card) == ''){
							/*Using One Click Method*/
							async.waterfall([
								function upd_order(cb2){
									var form_upd = {
										$set:{
											order_status:'pending_shipment',
											payment_status:'paid'
										}
									}
									order.update({order_id:order_id},form_upd,function(err,upd){
										if(err){
											debug.log('error line 272');
											cb2(null,false);
										}else{
											cb2(null,true);
										}
									})
								},
								function upd_vt(stat,cb2){
									if(stat == true){
										order_coll.update({order_id:order_id},{$set:{vt_response:vt}},function(err,upd){
											if(err){
												debug.log('error line 283');
												cb2(null,false);
											}else{
												cb2(null,true);
											}
										})
									}else{
										cb2(null,false);
									}
								}
							],function(err,merge){
								if(merge == true){
									cb(null,{success:true,status:'capture',method:'one click'});
								}else if(merge == false){
									debug.log('error line 298');
									cb(null,false);
								}
							})
						}
					}else{
						debug.log('no card data');
						cb(null,false);
					}
				}else{
					debug.log('not credit_card payment');
					cb(null,false);
				}
			}else{
				debug.log('error line 377');
				cb(null,false);
			}
			
		}
	],function(err,merge){
		next(merge);
	})
}