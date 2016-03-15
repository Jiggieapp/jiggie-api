require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');

var comurl = 'https://commerce.jiggieapp.com/VT/production/';
// var comurl = 'http://127.0.0.1/VT/examples/';

exports.index = function(req, res){
	var type = req.body.type;
	if(type == 'cc'){
		post_transaction_cc(req,function(dt){
			if(dt == false){
				res.json({code_error:403})
			}else{
				res.json(dt);
			}
		})
	}else if(type == 'va'){
		post_transaction_va(req,function(dt){
			if(dt == false){
				res.json({code_error:403})
			}else{
				res.json(dt);
			}
		})
	}else if(type == 'bp'){
		post_transaction_va(req,function(dt){
			if(dt == false){
				res.json({code_error:403})
			}else{
				res.json(dt);
			}
		})
	}
	
};

/*Start : Transaction Using VA & BP*/
function post_transaction_va(req,next){
	var post = req.body;
	var order_id = post.order_id;
	var token_id = post.token_id;
	var type = post.type;
	
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
	async.waterfall([
		function get_order(cb){
			order.findOne({order_id:order_id},function(err,r){
				if(err){
					debug.log("error get order product data va")
					cb(null,false,{code_error:401})
				}else{
					if(r == null){
						debug.log("order product data null va")
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
						debug.log("error get customers data va")
						cb(null,false,{code_error:401},[])
					}else{
						if(r == null){
							debug.log("customers data null va");
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
				var items = []
				var n = 0;
				async.forEachOf(dt.product_list,function(v,k,e){
					items[n] = new Object();
					items[n].id = v.ticket_id;
					items[n].price = parseFloat(v.total_price_aftertax);
					items[n].quantity = parseFloat(v.num_buy);
					items[n].name = v.name;
					n++;
				})
				json_data.items = items;
				// e:items //
				
				// s:billing address //
				
				billing_address = new Object();
				billing_address.first_name = dt2.user_first_name;
				billing_address.last_name = dt2.user_last_name;
				json_data.billing_address = billing_address;
				
				// e:billing address //
				
				// s:shipping_address //
				
				shipping_address = new Object();
				shipping_address.first_name = dt2.user_first_name;
				shipping_address.last_name = dt2.user_last_name;
				json_data.shipping_address = shipping_address;
				
				// e:shipping_address //
				
				// s:customer_details //
				var customer_details = new Object();
				var fname = dt.guest_detail.name.split(' ');
				if(typeof fname[0] == 'undefined' || typeof fname[0] == ''){
					fname[0] = '';
				}
				if(typeof fname[1] == 'undefined' || typeof fname[1] == ''){
					fname[1] = '';
				}
				customer_details.first_name = fname[0];
				customer_details.last_name = fname[1];
				customer_details.email = dt.guest_detail.email;
				customer_details.phone = dt.guest_detail.phone;
				json_data.customer_details = customer_details;
				// e:customer_details //
				
				json_data.token_id = token_id;
				
				var url_execute = '';
				if(type == 'va'){
					url_execute = 'transaction_va.php';
				}else if(type == 'bp'){
					url_execute = 'transaction_bp.php';
				}
				
				// get timelimit
				tickettypes_coll.findOne({_id:new ObjectId(dt.product_list[0].ticket_id)},function(err,rr){
					if(err){
						cb(null,false,[],[])
					}else{
						var timelimit;
						if(typeof rr.payment_timelimit == 'undefined'){
							timelimit = 180;
						}else{
							timelimit = rr.payment_timelimit;
						}
						
						json_data.timelimit = timelimit;
						var options = {
							url : comurl+url_execute,
							form : json_data
						}
						curl.post(options,function(err,resp,body){
							if (!err && resp.statusCode == 200) {
								cb(null,true,dt,body)
							}else{
								cb(null,false,[],[]);
							}
						});
					}
				})
				
				
				
			}else{
				cb(null,false);
			}
		},
		function cek_transaction_vt(stat,dtorder,body,cb){
			var vt = JSON.parse(body);
			debug.log('cek VT');
			debug.log(vt);
			if(typeof vt.code_error == 'undefined'){
				cb(null,true,dtorder,body)	
			}else{
				debug.log("Error Code in VT Commerce VA");
				cb(null,false,[],[]);
			}
		},
		function merge_data(stat,dtorder,body,cb){
			debug.log('merging data payment')
			if(stat == true){
				merge_data_va(req,body,function(dt){
					if(dt == true){
						cb(null,true,dtorder,body);
					}else{
						debug.log('error line 160 => paymentjs');
						cb(null,false,[],[])
					}
				})
			}else{
				debug.log('error line 165 => paymentjs');
				cb(null,false,[]);
			}
		},
		function upd_vt(stat,dtorder,body,cb2){
			debug.log('updating vt');
			if(stat == true){
				var vt = JSON.parse(body);
				order_coll.update({order_id:order_id},{$set:{vt_response:vt}},function(err,upd){
					if(err){
						debug.log('error line 180-> paymentjs');
						cb2(null,false,[],[]);
					}else{
						cb2(null,true,dtorder,vt);
					}
				})
			}else{
				debug.log('error line 187 => paymentjs');
				cb2(null,false,[],[]);
			}
		},
		function send_notif(stat,dtorder,vt,cb2){
			if(stat == true){
				curl.get({url:'http://127.0.0.1:24534/notif_handle'},function(err,resp,body){})
				
				var form_post = new Object();
				form_post.vt = vt;
				form_post.email_to = dtorder.guest_detail.email;
				var options = {
					url:'http://127.0.0.1:24534/sendnotif',
					form:form_post
				}
				curl.post(options,function(err,resp,body){
					if(!err){
						cb2(null,true,vt);
					}else{
						cb2(null,false,[]);
					}
				})
			}else{
				cb2(null,false,[]);
			}
		}
	],function(err,merge,vt){
		if(merge == true){
			var str = '';
			if(type == 'bp'){
				str = {success:true,status:'capture',bill_key:vt.bill_key,biller_code:vt.biller_code,method:'Mandiri Bill Payment'}
			}else if(type == 'va'){
				str = {success:true,status:'capture',va_number:vt.permata_va_number,method:'Virtual Account'}
			}
			next(str)
		}else{
			next(false);
		}
	})
}

function merge_data_va(req,body,next){
	var post = req.body;
	var order_id = post.order_id;
	var token_id = post.token_id;
	var type = post.type;
	
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
	if(type == 'va' || type == 'bp'){
		async.waterfall([
			function get_stock(cb2){
				order.findOne({order_id:order_id},function(err,r){
					if(err){
						debug.log('error line 182');
						cb2(null,false,{code_error:403});
					}else{
						// update stock after success buy //
						var num_buy = 0;
						async.forEachOf(r.product_list,function(v,k,e){
							num_buy = v.num_buy;
							tickettypes_coll.findOne({_id:new ObjectId(v.ticket_id)},function(err2,r2){
								var quantity_old = r2.quantity;
								var new_qty = parseInt(quantity_old)-parseInt(num_buy);
								
								var form_update = {
									$set:{quantity:new_qty},
									$push:{qty_hold:{order_id:order_id,qty:num_buy}}
								}
								
								tickettypes_coll.update({_id:new ObjectId(v.ticket_id)},form_update,function(err3,upd){
									if(err3){
										debug.log('error update stock va');
										cb2(null,false);
									}else{
										cb2(null,true);
									}
								})
							})
						})
					
					}
				})
			},
			function upd_order(stat,cb2){
				if(stat == true){
					var form_upd = {
						$set:{
							order_status:'pending_payment',
							payment_status:'awaiting_payment'
						}
					}
					order.update({order_id:order_id},form_upd,function(err,upd){
						if(err){
							debug.log('error line 222');
							cb2(null,false);
						}else{
							cb2(null,true);
						}
					})
				}else{
					cb2(null,false);
				}
			},
		],function(err,merge){
			next(merge);
		})
	}
	
	
}

/*End: Transaction Using VA & BP*/


/*Start:Transaction Using CC*/
function post_transaction_cc(req,next){
	var post = req.body;
	var order_id = post.order_id;
	var token_id = post.token_id;
	var type = post.type;
	var save_cc = post.is_new_card;
	var secure_cc = 1;
	var first_name_cc = post.first_name_cc;
	var last_name_cc = post.last_name_cc;
	
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
	debug.log('post data ######');
	debug.log(post);
	
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
					items[n].price = parseFloat(v.total_price);
					items[n].quantity = parseInt(v.num_buy);
					items[n].name = v.name;
					n++;
				})
				json_data.items = items;
				// e:items //
				
				// s:billing address //
				billing_address = new Object();
				if(String(is_new_card) == '1'){
					billing_address.first_name = first_name_cc;
					billing_address.last_name = last_name_cc;
				}
				
				json_data.billing_address = billing_address;
				// e:billing address //
				
				// s:shipping_address //
				
				shipping_address = new Object();
				// shipping_address.first_name = dt2.user_first_name;
				// shipping_address.last_name = dt2.user_last_name;
				json_data.shipping_address = shipping_address;
				
				// e:shipping_address //
				
				// s:customer_details //
				var customer_details = new Object();
				var fname = dt.guest_detail.name.split(' ');
				if(typeof fname[0] == 'undefined' || typeof fname[0] == ''){
					fname[0] = '';
				}
				if(typeof fname[1] == 'undefined' || typeof fname[1] == ''){
					fname[1] = '';
				}
				customer_details.first_name = fname[0];
				customer_details.last_name = fname[1];
				customer_details.email = dt.guest_detail.email;
				customer_details.phone = dt.guest_detail.phone;
				json_data.customer_details = customer_details;
				// e:customer_details //
				
				json_data.token_id = token_id;
				
				json_data.save_cc = parseInt(save_cc);
				json_data.secure = parseInt(secure_cc);
				
				var options = {
					url : comurl+'transaction_cc.php',
					form : json_data
				}
				curl.post(options,function(err,resp,body){
					if (!err && resp.statusCode == 200) {
						debug.log('transaction execute CC Successs');
						cb(null,true,dt,dt2,body)
					}else{
						debug.log('transaction execute CC Failed');
						cb(null,false,[],[],[]);
					}
				});
			}else{
				debug.log('line 195 err');
				cb(null,false,[],[],[]);
			}
		},
		function cek_transaction_vt(stat,dt,dt2,body,cb){
			var vt = JSON.parse(body);
			debug.log(vt);
			if(typeof vt.code_error == 'undefined'){
				cb(null,true,dt,dt2,body)	
			}else{
				debug.log("Error Code in VT Commerce CC");
				cb(null,false,[],[],[]);
			}
		},
		function merge_data(stat,dt,dt2,body,cb){
			if(stat == true){
				var vt = JSON.parse(body);
				debug.log('Response VT');
				debug.log(vt);
				debug.log('#############3');
				
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
												if (!err2) {
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
											cb2(null,true);
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
															tickettypes_coll.update({_id:new ObjectId(v.ticket_id)},{$set:{quantity:new_qty}},function(err3,upd){
																if(err3){
																	debug.log('error update stock');
																	cb2(null,false);
																}else{
																	debug.log('updated stock');
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
											
											var last_cc = new Object();
											last_cc.masked_card = masked_card;
											last_cc.saved_token_id = saved_token_id;
											last_cc.payment_type = payment_type;
											last_cc.saved_token_id_expired_at = saved_token_id_expired_at;
											
											/*var cond = {
												fb_id:dt2.fb_id,
												"cc_info.token_id":token_id
											}
											
											var form_updst = {
												$set:{
													"last_cc":last_cc,
													"cc_info.$.masked_card":masked_card,
													"cc_info.$.saved_token_id":saved_token_id,
													"cc_info.$.saved_token_id_expired_at":saved_token_id_expired_at,
													"cc_info.$.payment_type":payment_type,
													"cc_info.$.is_verified":true
												}
											}
											
											customers_coll.update(cond,form_updst,function(ers2,upd){
												if(ers2){
													cb2(null,false);
												}else{
													cb2(null,true);
												}
											})*/
											
											var cond = {
												fb_id:dt2.fb_id,
												"cc_info.masked_card":masked_card
											}
											customers_coll.findOne(cond,function(ers,rs){
												if(ers){
													cb2(null,false);
												}else{
													if(rs != null){
														var form_updst = {
															$set:{
																"last_cc":last_cc,
																"cc_info.$.saved_token_id":saved_token_id,
																"cc_info.$.saved_token_id_expired_at":saved_token_id_expired_at
															}
														}
														customers_coll.update(cond,form_updst,function(ers2,upds2){
															if(ers2){
																cb2(null,false);
															}else{
																cb2(null,true);
															}
														})
													}else{
														var data_push = {
															first_name:first_name_cc,
															last_name:last_name_cc,
															masked_card : masked_card,
															saved_token_id : saved_token_id,
															saved_token_id_expired_at : saved_token_id_expired_at,
															payment_type : payment_type
														}
														var form_upd = {
															$push:{cc_info:data_push},
															$set:{"last_cc":last_cc}
														}
														customers_coll.update({fb_id:dt2.fb_id},form_upd,function(err2,upd){
															if(err2){
																debug.log("error update line 172");
																cb2(null,false);
															}else{
																debug.log("updated cc info");
																cb2(null,true);
															}
														})
													}
												}
											})
											
											
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
									},
									function send_notif(stat,cb2){
										if(stat == true){
											curl.get({url:'http://127.0.0.1:24534/notif_handle'},function(err,resp,body){})
											
											var form_post = new Object();
											form_post.vt = vt;
											form_post.email_to = dtorder.guest_detail.email;
											var options = {
												url:'http://127.0.0.1:24534/sendnotif',
												form:form_post
											}
											curl.post(options,function(err,resp,body){
												if(!err){
													cb2(null,true)
												}else{
													cb2(null,false);
												}
											})
										}else{
											cb2(null,false)
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
								debug.log("Transaction Deny From VT in CC");
								cb(null,{code_error:403});
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
														if(err2){
															debug.log('error updating stok');
															cb2(null,false);
														}else{
															var quantity_old = r2.quantity;
															var new_qty = parseInt(quantity_old)-parseInt(num_buy);
															tickettypes_coll.update({_id:new ObjectId(v.ticket_id)},{$set:{quantity:new_qty}},function(err3,upd){
																if(err3){
																	debug.log('error update stock');
																	cb2(null,false);
																}else{
																	cb2(null,true);
																}
															})
														}
													})
												})
											
											}
										})
									}else if(stat == false){
										cb2(null,false);
									}
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
								},
								function send_notif(stat,cb2){
									if(stat == true){
										curl.get({url:'http://127.0.0.1:24534/notif_handle'},function(err,resp,body){})
										
										var form_post = new Object();
										form_post.vt = vt;
										form_post.email_to = dtorder.guest_detail.email;
										var options = {
											url:'http://127.0.0.1:24534/sendnotif',
											form:form_post
										}
										curl.post(options,function(err,resp,body){
											if(!err){
												cb2(null,true)
											}else{
												cb2(null,false);
											}
										})
									}else{
										cb2(null,false)
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