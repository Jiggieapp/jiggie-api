require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');

var fs = require('fs-sync');
var path = require('path');
var ppt = path.join(__dirname,"../../global/commerce.json");
var pkg = fs.readJSON(ppt);
var comurl = pkg.uri

var Redis  = require("redis");
var redis  = Redis.createClient(6379,"jiggieappsredis.futsnq.0001.apse1.cache.amazonaws.com");

exports.index = function(req, res){
	var type = req.body.type;
	var post = req.body;
	type = type.toLowerCase();
	
	async.waterfall([
		function cek_ispaid(cb){
			var order_id = String(post.order_id);
			order_coll.findOne({order_id:order_id},function(err,r){
				if(err){
					debug.log(err)
					debug.log('error commerce line 22')
					cb(null,false,[],{msg:'Payment Has Already Paid',type:'paid'})
				}else{
					if(r == null){
						debug.log('error line 26 commerce')
						cb(null,false,[],{msg:'Payment Has Already Paid',type:'paid'})
					}else{
						if(r.order_status == 'checkout_incompleted'){
							debug.log('cek is paid true')
							cb(null,true,r,[])
						}else{
							debug.log('cek is paid false')
							cb(null,false,[],{msg:'Payment Has Already Paid',type:'paid'})
						}
					}
				}
				
			})
		},
		function cek_quantity(stat,rows_order,ers,cb){
			if(stat == true){
				var ticket_id = rows_order.product_list[0].ticket_id
				tickettypes_coll.findOne({_id:new ObjectId(ticket_id),active:{$ne:false},status:{$ne:'inactive'}},function(err,r){
					if(err){
						debug.log('error line 44 commerce')
						debug.log(err)
						cb(null,false,{msg:'Sorry, this ticket is already unavailable',type:'ticket_list'})
					}else{
						if(r == null){
							debug.log('error line 49 validation commerce')
							cb(null,false,{msg:'Sorry, this ticket is already unavailable',type:'ticket_list'})
						}else{
							if(r.status == 'sold out' || r.quantity == 0){
								cb(null,false,{msg:'Sorry, this ticket is unavailable',type:'ticket_list'})
							}else{
								if(r.ticket_type != 'booking'){
									if(r.quantity >= rows_order.product_list[0].num_buy){
										debug.log('cek quantity true')
										cb(null,true,[])
									}else{
										debug.log('cek quantity false')
										if(r.quantity == 1){
											cb(null,false,{msg:'Sorry, we only have '+r.quantity+' ticket left',type:'ticket_details'})
										}else if(r.quantity > 1){
											cb(null,false,{msg:'Sorry, we only have '+r.quantity+' tickets left',type:'ticket_details'})
										}
									}
								}else{
									cb(null,true,[])
								}
							}
						}
					}
				})
			}else{
				cb(null,false,ers)
			}
		},
		function execute(stat,msg_errors,cb){
			if(stat == true){
				if(type == 'cc'){
					post_transaction_cc(req,function(dt){
						if(dt == false){
							cb(null,false,{code_error:403});
						}else{
							cb(null,true,dt);
						}
					})
				}else if(type == 'va'){
					post_transaction_va(req,function(dt){
						if(dt == false){
							cb(null,false,{code_error:403});
						}else{
							cb(null,true,dt);
						}
					})
				}else if(type == 'bp'){
					post_transaction_va(req,function(dt){
						if(dt == false){
							cb(null,false,{code_error:403});
						}else{
							cb(null,true,dt);
						}
					})
				}else if(type == 'bca'){
					post_transaction_va(req,function(dt){
						if(dt == false){
							cb(null,false,{code_error:403});
						}else{
							cb(null,true,dt);
						}
					})
				}
			}else{
				cb(null,false,msg_errors)
			}
		}
	],function(err,stat,et){
		if(stat == false){
			res.json({
				code_error:403,
				msg:et.msg,
				type:et.type
			})
		}else if(stat == true){
			res.json(et)
		}
	})
	
	
	
	
	
};

/*Start : Transaction Using VA & BP*/
function post_transaction_va(req,next){
	var post = req.body;
	var order_id = String(post.order_id);
	var token_id = post.token_id;
	var type = post.type;
	var pay_deposit = post.pay_deposit;
	type = type.toLowerCase();
	
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	debug.log('DATA PAYMENT ###########################')
	debug.log(post)
	debug.log('//DATA PAYMENT ###########################')
	
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
		function is_ticket_exist(stat,dt,cb){
			if(stat == true){
				var cond22 = {
					_id:new ObjectId(dt.product_list[0].ticket_id),
					active:{$ne:false},
					status:'active'
				}
				tickettypes_coll.findOne(cond22,function(err,r){
					if(err){
						debug.log('error line 105 payment commerce')
						cb(null,false,[]);
					}else{
						if(r == null){
							debug.log('error line 109 payment commerce')
							cb(null,false,[]);
						}else{
							if(r.quantity >= dt.product_list[0].num_buy){
								cb(null,true,dt);
							}else{
								debug.log('quantity limited')
								cb(null,false,[]);
							}
							
						}
					}
				})
			}else{
				cb(null,false,[]);
			}
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
		function cek_valid_min_deposit_booking(stat,dt,dt2,cb){
			if(stat == true){
				if(dt.product_list[0].ticket_type == 'booking'){
					if(typeof dt.min_deposit_amount == "undefined"){
						if(parseFloat(pay_deposit) >= parseFloat(dt.product_list[0].min_deposit_amount)){
							cb(null,true,dt,dt2);
						}else{
							debug.log('error min deposit required for booking');
							cb(null,false,[],[]);
						}
					}else{
						if(parseFloat(pay_deposit) >= parseFloat(dt.min_deposit_amount)){
							cb(null,true,dt,dt2);
						}else{
							debug.log('error min deposit required for booking 2');
							cb(null,false,[],[]);
						}
					}
				}else{
					cb(null,true,dt,dt2);
				}
			}else{
				cb(null,false,[],[]);
			}
		},
		function get_event(stat,dt,dt2,cb){
			if(stat == true){
				events_detail_coll.findOne({_id:new ObjectId(dt.event_id)},function(err,r){
					if(err){
						cb(null,false,[],[],[]);
					}else{
						if(r == null){
							cb(null,false,[],[],[]);
						}else{
							cb(null,true,dt,dt2,r);
						}
					}
				})
			}else{
				cb(null,false,[],[],[]);
			}
		},
		function get_promo(stat,dt,dt2,rows_event,cb){
			if(stat == true){
				redis.get("order_"+order_id+"_"+dt.fb_id+"_credit",function(err,credit){
					if(credit == null){
						debug.log3("data redis credit null");
						cb(null,false,[],[],[],[],[]);
					}else{
						redis.get("order_"+order_id+"_"+dt.fb_id+"_datacredit",function(err2,datacredit){
							if(datacredit == null){
								debug.log3("data redis datacredit null");
								cb(null,false,[],[],[],[],[]);
							}else{
								redis.get("order_"+order_id+"_"+dt.fb_id+"_discount",function(err2,discount){
									if(discount == null){
										debug.log3("data redis _discount null");
										cb(null,false,[],[],[],[],[],[],[]);
									}else{
										redis.get("order_"+order_id+"_"+dt.fb_id+"_datadiscount",function(err2,datadiscount){
											if(datadiscount == null){
												debug.log3("data redis _datadiscount null");
												cb(null,false,[],[],[],[],[],[],[]);
											}else{
												cb(null,true,dt,dt2,rows_event,JSON.parse(credit),JSON.parse(datacredit),JSON.parse(discount),JSON.parse(datadiscount))
											}
										})
									}
								})
								
							}
						})
						
					}
				})
			}else{
				cb(null,false,[],[],[],[],[],[],[]);
			}
		},
		function sync_data(stat,dt,dt2,rows_event,credit,datacredit,discount,datadiscount,cb){
			if(stat == true){
				var json_data = new Object();
				
				// s:transaction_details //
				transaction_details = new Object();	
				transaction_details.order_id = order_id;
				if(dt.product_list[0].ticket_type == 'purchase'){
					transaction_details.gross_amount = parseFloat(dt.total_price);
				}else if(dt.product_list[0].ticket_type == 'booking'){
					transaction_details.gross_amount = parseInt(pay_deposit);
				}
				json_data.transaction_details = transaction_details;
				// e:transaction_details //
				
				// s:items //
				var items = []
				var n = 0;
				async.forEachOf(dt.product_list,function(v,k,e){
					items[n] = new Object();
					items[n].id = v.ticket_id;
					items[n].name = v.name+'('+v.num_buy+'X)';
					if(v.ticket_type == 'purchase'){
						items[n].price = parseFloat(dt.total_price);
						items[n].quantity = parseFloat(1);
					}else if(v.ticket_type == 'booking'){
						items[n].price = parseInt(pay_deposit);
						items[n].quantity = parseInt(1);
					}
					n++;
				})
				json_data.items = items;
				// e:items //
				
				json_data.ticket_name = dt.product_list[0].name;
				json_data.event_name = rows_event.title;
				json_data.guest_name = dt.guest_detail.name;
				
				
				// s:billing address //
				
				// billing_address = new Object();
				// billing_address.first_name = dt2.user_first_name;
				// billing_address.last_name = dt2.user_last_name;
				// json_data.billing_address = billing_address;
				
				// e:billing address //
				
				// s:shipping_address //
				
				// shipping_address = new Object();
				// shipping_address.first_name = dt2.user_first_name;
				// shipping_address.last_name = dt2.user_last_name;
				// json_data.shipping_address = shipping_address;
				
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
				json_data.code = dt.code;
				
				if(dt.product_list[0].ticket_type == 'booking'){
					json_data.booking_guest_numbuy = dt.product_list[0].num_buy;
				}else if(dt.product_list[0].ticket_type == 'purchase'){
					json_data.booking_guest_numbuy = 0;
				}
				var url_execute = '';
				if(type == 'va'){
					url_execute = 'transaction_va.php';
				}else if(type == 'bp'){
					url_execute = 'transaction_bp.php';
				}else if(type == 'bca'){
					url_execute = 'transaction_bca.php';
				}
				
				// get timelimit
				tickettypes_coll.findOne({_id:new ObjectId(dt.product_list[0].ticket_id)},function(err,rr){
					if(err){
						cb(null,false,[],[],[],[],[],[],[],[])
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
								debug.log('VT RESPONSE SUCCESS')
								cb(null,true,dt,body,dt2,rows_event,credit,datacredit,discount,datadiscount)
							}else{
								debug.log('VT RESPONSE FAILED')
								cb(null,false,[],[],[],[],[],[],[],[]);
							}
						});
					}
				})
				
				
				
			}else{
				cb(null,false,[],[],[],[],[],[],[],[]);
			}
		},
		function cek_transaction_vt(stat,dtorder,body,rows_cust,rows_event,credit,datacredit,discount,datadiscount,cb){
			if(stat == true){
				debug.log('cek VT');
				debug.log(body);
				var vt = JSON.parse(body);
				if(typeof vt.code_error == 'undefined'){
					cb(null,true,dtorder,body,rows_cust,rows_event,credit,datacredit,discount,datadiscount)	
				}else{
					debug.log("Error Code in VT Commerce VA");
					cb(null,false,[],[],[],[],[],[],[],[]);
				}
			}else{
				cb(null,false,[],[],[],[],[],[],[],[]);
			}
		},
		function merge_data(stat,dtorder,body,rows_cust,rows_event,credit,datacredit,discount,datadiscount,cb){
			debug.log('merging data payment')
			if(stat == true){
				merge_data_va(req,body,function(dt){
					if(dt == true){
						cb(null,true,dtorder,body,rows_cust,rows_event,credit,datacredit,discount,datadiscount);
					}else{
						debug.log('error line 160 => paymentjs');
						cb(null,false,[],[],[],[],[],[],[],[])
					}
				})
			}else{
				debug.log('error line 165 => paymentjs');
				cb(null,false,[],[],[],[],[],[],[],[]);
			}
		},
		function upd_vt(stat,dtorder,body,rows_cust,rows_event,credit,datacredit,discount,datadiscount,cb2){
			debug.log('updating vt');
			if(stat == true){
				var vt = JSON.parse(body);
				var form_upd = {
					$set:{
						vt_response:vt,
						created_at_swipetopay:new Date(),
						credit:credit,
						datacredit:datacredit
					}
				}
				order_coll.update({order_id:order_id},form_upd,function(err,upd){
					if(err){
						debug.log('error line 180-> paymentjs');
						cb2(null,false,[],[],[],[],[],[],[],[]);
					}else{
						cb2(null,true,dtorder,vt,rows_cust,rows_event,credit,datacredit,discount,datadiscount);
					}
				})
			}else{
				debug.log('error line 187 => paymentjs');
				cb2(null,false,[],[],[],[],[],[],[],[]);
			}
		},
		function update_customers(stat,dtorder,vt,rows_cust,rows_event,credit,datacredit,discount,datadiscount,cb2){
			debug.log('updating customers')
			if(stat == true){
				var cond = {
					fb_id:dtorder.fb_id
				}
				var form_upd = {
					$set:{last_cc:{payment_type:type}}
				}
				
				customers_coll.update(cond,form_upd,function(err,upd){
					if(upd){
						cb2(null,true,dtorder,vt,rows_cust,rows_event,credit,datacredit,discount,datadiscount);
					}
				})
			}else{
				cb2(null,false,[],[],[],[],[],[],[],[]);
			}
		},
		function update_credit(stat,dtorder,vt,rows_cust,rows_event,credit,datacredit,discount,datadiscount,cb2){
			if(stat == true){
				var credit_used = parseInt(credit.credit_used)
				async.forEachOf(datacredit,function(v,k,e){
					if(parseInt(credit_used) > 0){
						/*start:updating inviter credit if is_chain = true*/
						inviter_get_credit(v,dtorder,rows_cust)
						/*end:updating inviter credit if is_chain = true*/
						
						var value_left = parseFloat(v.rows_data.credit.amount_invitee) - parseFloat(credit_used);
						if(value_left > 0){
							value_left = value_left
							credit_used = 0;
						}else{
							value_left = 0
							credit_used = Math.abs(parseFloat(v.rows_data.credit.amount_invitee) - parseFloat(credit_used))
						}
						
						var cond = {
							fb_id:dtorder.fb_id,
							"promo_code.rules_id":{$in:[new ObjectId(v.rules_id),String(v.rules_id)]}
						}
						var form_upd = {
							$set:{
								"promo_code.$.used":true,
								"promo_code.$.used_by":{
									order_id:dtorder.order_id,
									value_left:value_left
								}
							}
						}
						customers_coll.update(cond,form_upd,function(err){if(err){debug.log3(err)}})
						
					}
				})
				
				var cond_credit = {fb_id:dtorder.fb_id}
				var form_credit = {
					$set:{
						totcredit_appinvite:credit.credit_left
					},
					$push:{
						activity:{
							rewards:-credit.credit_used,
							type:"promo",
							plot:"credit",
							flow:"out_from_promo",
							logs:{},
							from_fb_id:dtorder.fb_id,
							updated_at:new Date(),
							rules_id:""
						}
					}
				}
				credit_points_coll.update(cond_credit,form_credit,function(err,upd){if(err){debug.log3(err)}})
				
				cb2(null,true,dtorder,vt,rows_cust,rows_event,discount,datadiscount)
			}else{
				cb2(null,false,[],[],[],[],[],[])
			}
		},
		function update_discount(stat,dtorder,vt,rows_cust,rows_event,discount,datadiscount,cb2){
			if(stat == true){
				async.forEachOf(datadiscount,function(v,k,e){
					var cond = {
						_id:new ObjectId(v._id)
					}
					var form_upd = {
						$push:{
							"discount.used_at":{
								fb_id:dtorder.fb_id,
								order_id:dtorder.order_id
							}
						}
					}
					promo_rules_coll.update(cond,form_upd,function(err,upd){
						if(err){
							debug.logdis(err)
						}
					})
				})
				
				
				cb2(null,true,dtorder,vt,rows_cust,rows_event)
			}else{
				cb2(null,false,[],[],[],[])
			}
		},
		function send_notif(stat,dtorder,vt,rows_cust,rows_event,cb2){
			debug.log('send notif')
			if(stat == true){
				var email_to = [];
				var n = 0;
				email_to.push(dtorder.guest_detail.email)
				email_to.push("orders@jiggieapp.com");
				email_to.push("cs@jiggieapp.com");
				if(typeof rows_event.organizer != 'undefined' && rows_event.organizer.length > 0){
					async.forEachOf(rows_event.organizer,function(v3,k3,e3){
						email_to.push(v3.email);
					})
				}
				debug.log('USING EMAIL : ')
				debug.log(email_to)
				
				async.forEachOf(email_to,function(vm,km,em){
					var form_post = new Object();
					form_post.vt = vt;
					// form_post.email_to = dtorder.guest_detail.email;
					form_post.email_to = vm;
					var options = {
						url:'http://127.0.0.1:31456/sendnotif',
						form:form_post
					}
					curl.post(options,function(err,resp,body){
						if(err){
							debug.log(err)
						}
					})
				})
				cb2(null,true,vt);
				
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
				str = {success:true,status:'capture',va_number:vt.permata_va_number,method:'PERMATA Virtual Account'}
			}else if(type == 'bca'){
				str = {success:true,status:'capture',va_number:vt.va_numbers[0].va_number,method:'BCA Virtual Account'}
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
	var pay_deposit = post.pay_deposit;
	type = type.toLowerCase();
	
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
	if(type == 'va' || type == 'bp' || type == 'bca'){
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
							tickettypes_coll.findOne({_id:new ObjectId(v.ticket_id)},function(err2,r2){
								var quantity_old = r2.quantity;
								if(r2.ticket_type == 'booking'){
									num_buy = 1;
								}else{
									num_buy = v.num_buy;
								}
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
	var order_id = String(post.order_id);
	var token_id = post.token_id;
	var pay_deposit = post.pay_deposit;
	var type = post.type;
	type = type.toLowerCase();
	var is_new_card = post.is_new_card;
	var secure_cc = 1;
	
	var first_name_cc = ""
	var last_name_cc = ""
	var name_cc = post.name_cc;
	var ex_name = name_cc.split(' ');
	if(typeof ex_name != 'undefined'){
		first_name_cc = ex_name[0];
		async.forEachOf(ex_name,function(v,k,e){
			if(k != 0){
				last_name_cc += v+' ';
			}
		})
	}else{
		first_name_cc = name_cc;
		last_name_cc = '';
	}
	
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
		function is_ticket_exist(stat,dt,cb){
			if(stat == true){
				var cond22 = {
					_id:new ObjectId(dt.product_list[0].ticket_id),
					active:{$ne:false},
					status:'active'
				}
				tickettypes_coll.findOne(cond22,function(err,r){
					if(err){
						cb(null,false,[]);
					}else{
						if(r == null){
							cb(null,false,[]);
						}else{
							if(r.quantity >= dt.product_list[0].num_buy){
								cb(null,true,dt);
							}else{
								debug.log('quantity limited')
								cb(null,false,[]);
							}
							
						}
					}
				})
			}else{
				cb(null,false,[]);
			}
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
		function cek_valid_min_deposit_booking(stat,dt,dt2,cb){
			if(stat == true){
				if(dt.product_list[0].ticket_type == 'booking'){
					if(typeof dt.min_deposit_amount == "undefined"){
						if(parseFloat(pay_deposit) >= parseFloat(dt.product_list[0].min_deposit_amount)){
							cb(null,true,dt,dt2);
						}else{
							debug.log('error min deposit required for booking');
							cb(null,false,[],[]);
						}
					}else{
						if(parseFloat(pay_deposit) >= parseFloat(dt.min_deposit_amount)){
							cb(null,true,dt,dt2);
						}else{
							debug.log('error min deposit required for booking 2');
							cb(null,false,[],[]);
						}
					}
				}else{
					cb(null,true,dt,dt2);
				}
			}else{
				cb(null,false,[],[]);
			}
		},
		function get_event(stat,dt,dt2,cb){
			if(stat == true){
				events_detail_coll.findOne({_id:new ObjectId(dt.event_id)},function(err,r){
					if(err){
						cb(null,false,[],[],[]);
					}else{
						if(r == null){
							cb(null,false,[],[],[]);
						}else{
							cb(null,true,dt,dt2,r);
						}
					}
				})
			}else{
				cb(null,false,[],[],[]);
			}
		},
		function get_promo(stat,dt,dt2,rows_event,cb){
			if(stat == true){
				redis.get("order_"+order_id+"_"+dt.fb_id+"_credit",function(err,credit){
					if(credit == null){
						debug.log3("data redis credit null");
						cb(null,false,[],[],[],[],[],[],[]);
					}else{
						redis.get("order_"+order_id+"_"+dt.fb_id+"_datacredit",function(err2,datacredit){
							if(datacredit == null){
								debug.log3("data redis datacredit null");
								cb(null,false,[],[],[],[],[],[],[]);
							}else{
								redis.get("order_"+order_id+"_"+dt.fb_id+"_discount",function(err2,discount){
									if(discount == null){
										debug.log3("data redis discount null");
										cb(null,false,[],[],[],[],[],[],[]);
									}else{
										redis.get("order_"+order_id+"_"+dt.fb_id+"_datadiscount",function(err2,datadiscount){
											if(datadiscount == null){
												debug.log3("data redis datadiscount null");
												cb(null,false,[],[],[],[],[],[],[]);
											}else{
												cb(null,true,dt,dt2,rows_event,JSON.parse(credit),JSON.parse(datacredit),JSON.parse(discount),JSON.parse(datadiscount))
											}
										})
									}
								})
								
							}
						})
						
					}
				})
			}else{
				cb(null,false,[],[],[],[],[],[],[]);
			}
		},
		function sync_data(stat,dt,dt2,rows_event,credit,datacredit,discount,datadiscount,cb){
			if(stat == true){
				var json_data = new Object();
				var customer_details = new Object();
				
				// s:transaction_details //
				transaction_details = new Object();	
				transaction_details.order_id = order_id;
				if(dt.product_list[0].ticket_type == 'purchase'){
					transaction_details.gross_amount = parseFloat(dt.total_price);
				}else if(dt.product_list[0].ticket_type == 'booking'){
					transaction_details.gross_amount = parseInt(pay_deposit);
				}
				json_data.transaction_details = transaction_details;
				// e:transaction_details //
				
				// s:items //
				var items = [];
				var n = 0;
				async.forEachOf(dt.product_list,function(v,k,e){
					items[n] = new Object();
					items[n].id = v.ticket_id;
					items[n].name = v.name+'('+v.num_buy+'X)';
					if(v.ticket_type == 'purchase'){
						// items[n].price = parseFloat(v.total_price_all);
						items[n].price = parseFloat(dt.total_price);
						items[n].quantity = parseFloat(1);
					}else if(v.ticket_type == 'booking'){
						items[n].price = parseInt(pay_deposit);
						items[n].quantity = parseInt(1);
					}
					n++;
				})
				json_data.items = items;
				// e:items //
				
				json_data.ticket_name = dt.product_list[0].name;
				json_data.event_name = rows_event.title;
				json_data.guest_name = dt.guest_detail.name;
				
				// s:billing address //
				if(String(is_new_card) == '1'){
					billing_address = new Object();
					billing_address.first_name = first_name_cc;
					billing_address.last_name = last_name_cc;
					customer_details.billing_address = billing_address;
				}else if(String(is_new_card) == '0'){
					billing_address = new Object();
					async.forEachOf(dt.cc_info,function(v,k,e){
						if(v.saved_token_id == token_id){
							billing_address.first_name = v.first_name;
							billing_address.last_name = v.last_name;
						}
					})
					customer_details.billing_address = billing_address;
				}
				
				// e:billing address //
				
				// s:shipping_address //
				
				// shipping_address = new Object();
				// shipping_address.first_name = dt2.user_first_name;
				// shipping_address.last_name = dt2.user_last_name;
				// json_data.shipping_address = shipping_address;
				
				// e:shipping_address //
				
				// s:customer_details //
				
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
				json_data.code = dt.code;
				
				json_data.save_cc = parseInt(1);
				json_data.secure = parseInt(secure_cc);
				
				var options = {
					url : comurl+'transaction_cc.php',
					form : json_data
				}
				curl.post(options,function(err,resp,body){
					if (!err && resp.statusCode == 200) {
						debug.log('transaction execute CC Successs');
						cb(null,true,dt,dt2,body,rows_event,credit,datacredit,discount,datadiscount)
					}else{
						debug.log('transaction execute CC Failed');
						cb(null,false,[],[],[],[],[],[],[],[]);
					}
				});
			}else{
				debug.log('line 195 err');
				cb(null,false,[],[],[],[],[],[],[],[]);
			}
		},
		function cek_transaction_vt(stat,dt,dt2,body,rows_event,credit,datacredit,discount,datadiscount,cb){
			if(stat == true){
				var vt = JSON.parse(body);
				debug.log(vt);
				if(typeof vt.code_error == 'undefined'){
					cb(null,true,dt,dt2,body,rows_event,credit,datacredit,discount,datadiscount)	
				}else{
					debug.log("Error Code in VT Commerce CC");
					cb(null,false,dt,dt2,body,rows_event,credit,datacredit,[],[]);
				}
			}else{
				cb(null,false,dt,dt2,body,rows_event,credit,datacredit,[],[]);
			}
		},
		function merge_data(stat,dt,dt2,body,rows_event,credit,datacredit,discount,datadiscount,cb){
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
														tickettypes_coll.findOne({_id:new ObjectId(v.ticket_id)},function(err2,r2){
															if(r2.ticket_type == 'booking'){
																num_buy = 1
															}else{
																num_buy = v.num_buy;
															}
															
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
									function update_sold(stat,cb2){
										if(stat == true){
											order.findOne({order_id:order_id},function(err,r){
												async.forEachOf(r.product_list,function(v,k,e){
													var num_buy = 0;
													if(v.ticket_type == 'booking'){
														num_buy = 1
													}else{
														num_buy = v.num_buy
													}
													var condt = {
														_id:new ObjectId(v.ticket_id)
													}
													var form_upd = {
														$push:{
															sold:{
																order_id:order_id,
																num_buy:num_buy
															}
														}
													}
													tickettypes_coll.update(condt,form_upd,function(err3,upd){
														if(err3){
															debug.log('error update sold');
															cb2(null,false);
														}else{
															debug.log('updated sold');
															cb2(null,true);
														}
													})
												})
											})
										}else{
											cb2(null,false);
										}
										
									},
									function upd_order(stat,cb2){
										if(stat == true){
											var form_upd = {
												$set:{
													order_status:'completed',
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
											debug.log('error line 877 commerce')
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
											last_cc.payment_type = 'cc';
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
															payment_type : 'cc'
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
											debug.log('error line 968 commerce')
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
											debug.log('error line 982 commerce')
											cb2(null,false);
										}
									},
									function update_credit(stat,cb2){
										if(stat == true){
											var credit_used = parseInt(credit.credit_used)
											async.forEachOf(datacredit,function(v,k,e){
												if(parseInt(credit_used) > 0){
													/*start:updating inviter credit if is_chain = true*/
													inviter_get_credit(v,dt,dt2)
													/*end:updating inviter credit if is_chain = true*/
													
													var value_left = parseFloat(v.rows_data.credit.amount_invitee) - parseFloat(credit_used);
													if(value_left > 0){
														value_left = value_left
														credit_used = 0;
													}else{
														value_left = 0
														credit_used = Math.abs(parseFloat(v.rows_data.credit.amount_invitee) - parseFloat(credit_used))
													}
													
													var cond = {
														fb_id:dt.fb_id,
														"promo_code.rules_id":{$in:[new ObjectId(v.rules_id),String(v.rules_id)]}
													}
													var form_upd = {
														$set:{
															"promo_code.$.used":true,
															"promo_code.$.used_by":{
																order_id:dt.order_id,
																value_left:value_left
															}
														}
													}
													customers_coll.update(cond,form_upd,function(err){if(err){debug.log3(err)}})
													
												}
											})
											
											var cond_credit = {fb_id:dt.fb_id}
											var form_credit = {
												$set:{
													totcredit_appinvite:credit.credit_left
												},
												$push:{
													activity:{
														rewards:-credit.credit_used,
														type:"promo",
														plot:"credit",
														flow:"out_from_promo",
														logs:{},
														from_fb_id:dt.fb_id,
														updated_at:new Date(),
														rules_id:""
													}
												}
											}
											credit_points_coll.update(cond_credit,form_credit,function(err,upd){if(err){debug.log3(err)}})
											
											cb2(null,true)
										}else{
											cb2(null,false)
										}
									},
									function update_discount(stat,cb2){
										if(stat == true){
											async.forEachOf(datadiscount,function(v,k,e){
												var cond = {
													_id:new ObjectId(v._id)
												}
												var form_upd = {
													$push:{
														"discount.used_at":{
															fb_id:dt.fb_id,
															order_id:dt.order_id
														}
													}
												}
												promo_rules_coll.update(cond,form_upd,function(err,upd){
													if(err){
														debug.logdis(err)
													}
												})
											})
											cb2(null,true)
										}else{
											cb2(null,false)
										}
									},
									function send_notif(stat,cb2){
										if(stat == true){
											order_coll.findOne({order_id:order_id},function(err,r){
												var email_to = [];
												var n = 0;
												email_to.push(r.guest_detail.email)
												email_to.push("orders@jiggieapp.com");
												email_to.push("cs@jiggieapp.com");
												if(typeof rows_event.organizer != 'undefined' && rows_event.organizer.length > 0){
													async.forEachOf(rows_event.organizer,function(v3,k3,e3){
														email_to.push(v3.email);
													})
												}
												debug.log('USING EMAIL : ')
												debug.log(email_to)
												
												async.forEachOf(email_to,function(vm,km,em){
													debug.log('send email cc')
													var form_post = new Object();
													form_post.vt = vt;
													// form_post.email_to = r.guest_detail.email;
													form_post.email_to = vm;
													var options = {
														url:'http://127.0.0.1:31456/sendnotif',
														form:form_post
													}
													curl.post(options,function(err,resp,body){
														if(err){
															debug.log(err)
														}
													})
												})
												cb2(null,true)
											})
										}else{
											debug.log('error line 1004 commerce send notif')
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
								cb(null,{code_error:403,msg:vt.status_message});
							}
						}else if(String(is_new_card) == '0' || String(is_new_card) == ''){
							/*Using One Click Method*/
							async.waterfall([
								function upd_order(cb2){
									var form_upd = {
										$set:{
											order_status:'completed',
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
													tickettypes_coll.findOne({_id:new ObjectId(v.ticket_id)},function(err2,r2){
														if(err2){
															debug.log('error updating stok');
															cb2(null,false);
														}else{
															if(r2.ticket_type == 'booking'){
																num_buy = 1
															}else{
																num_buy = v.num_buy;
															}
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
								function updated_sold(stat,cb2){
									if(stat == true){
										order.findOne({order_id:order_id},function(err,r){
											async.forEachOf(r.product_list,function(v,k,e){
												var num_buy = 0
												if(v.ticket_type == 'booking'){
													num_buy = 1
												}else{
													num_buy = v.num_buy
												}
												var condt = {
													_id:new ObjectId(v.ticket_id)
												}
												var form_upd = {
													$push:{
														sold:{
															order_id:order_id,
															num_buy:num_buy
														}
													}
												}
												tickettypes_coll.update(condt,form_upd,function(err3,upd){
													if(err3){
														debug.log('error update sold line 1090');
														cb2(null,false);
													}else{
														debug.log('updated sold');
														cb2(null,true);
													}
												})
											})
										})
									}else{
										debug.log('error commerce line 1077')
										cb2(null,false)
									}
								},
								function upd_customers(stat,cb2){
									if(stat == true){
										order_coll.findOne({order_id:order_id},function(err,rt){
											if(err){
												debug.log('error line 832');
												cb2(null,false,{code_error:403});
											}else{
												customers_coll.findOne({fb_id:rt.fb_id},function(err,rcust){
													if(typeof rcust.cc_info != 'undefined'){
														var new_lastcc = new Object();
														async.forEachOf(rcust.cc_info,function(v,k,e){
															debug.log(token_id+'=='+v.saved_token_id);
															if(v.saved_token_id == token_id){
																new_lastcc = v;
															}
														})
														debug.log(new_lastcc);
														customers_coll.update({fb_id:rt.fb_id},{$set:{last_cc:new_lastcc}},function(ers,upd){
															if(!err){
																cb2(null,true);
															}else{
																cb2(null,false)
															}
														})
													}
													
												})
											}
										})
									}else{
										debug.log('error line 1147 commerce')
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
										debug.log('error line 1115 commerce')
										cb2(null,false);
									}
								},
								function update_credit(stat,cb2){
									if(stat == true){
										var credit_used = parseInt(credit.credit_used)
										async.forEachOf(datacredit,function(v,k,e){
											if(parseInt(credit_used) > 0){
												/*start:updating inviter credit if is_chain = true*/
												inviter_get_credit(v,dt,dt2)
												/*end:updating inviter credit if is_chain = true*/
												
												var value_left = parseFloat(v.rows_data.credit.amount_invitee) - parseFloat(credit_used);
												if(value_left > 0){
													value_left = value_left
													credit_used = 0;
												}else{
													value_left = 0
													credit_used = Math.abs(parseFloat(v.rows_data.credit.amount_invitee) - parseFloat(credit_used))
												}
												
												var cond = {
													fb_id:dt.fb_id,
													"promo_code.rules_id":{$in:[new ObjectId(v.rules_id),String(v.rules_id)]}
												}
												var form_upd = {
													$set:{
														"promo_code.$.used":true,
														"promo_code.$.used_by":{
															order_id:dt.order_id,
															value_left:value_left
														}
													}
												}
												customers_coll.update(cond,form_upd,function(err){if(err){debug.log3(err)}})
												
											}
										})
										
										var cond_credit = {fb_id:dt.fb_id}
										var form_credit = {
											$set:{
												totcredit_appinvite:credit.credit_left
											},
											$push:{
												activity:{
													rewards:-credit.credit_used,
													type:"promo",
													plot:"credit",
													flow:"out_from_promo",
													logs:{},
													from_fb_id:dt.fb_id,
													updated_at:new Date(),
													rules_id:""
												}
											}
										}
										credit_points_coll.update(cond_credit,form_credit,function(err,upd){if(err){debug.log3(err)}})
										
										cb2(null,true)
									}else{
										cb2(null,false)
									}
								},
								function update_discount(stat,cb2){
									if(stat == true){
										async.forEachOf(datadiscount,function(v,k,e){
											var cond = {
												_id:new ObjectId(v._id)
											}
											var form_upd = {
												$push:{
													"discount.used_at":{
														fb_id:dt.fb_id,
														order_id:dt.order_id
													}
												}
											}
											promo_rules_coll.update(cond,form_upd,function(err,upd){
												if(err){
													debug.logdis(err)
												}
											})
										})
										cb2(null,true)
									}else{
										cb2(null,false)
									}
								},
								function send_notif(stat,cb2){
									if(stat == true){
										order_coll.findOne({order_id:order_id},function(err,r){
											var email_to = [];
											var n = 0;
											email_to.push(r.guest_detail.email)
											email_to.push("orders@jiggieapp.com");
											email_to.push("cs@jiggieapp.com");
											if(typeof rows_event.organizer != 'undefined' && rows_event.organizer.length > 0){
												async.forEachOf(rows_event.organizer,function(v3,k3,e3){
													email_to.push(v3.email);
												})
											}
											debug.log('USING EMAIL : ')
											debug.log(email_to)
											
											async.forEachOf(email_to,function(vm,km,em){
												var form_post = new Object();
												form_post.vt = vt;
												form_post.email_to = vm;
												// form_post.email_to = r.guest_detail.email;
												var options = {
													url:'http://127.0.0.1:31456/sendnotif',
													form:form_post
												}
												curl.post(options,function(err,resp,body){
													if(err){
														debug.log(err)
													}
												})
											})
											cb2(null,true)
										})
									}else{
										debug.log('error line 1168 commerce send notif')
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
				var vts = JSON.parse(body)
				var spmsg = vts.msg.replace('Veritrans Error (400):','')
				vts.msg = spmsg;
				vts.type = 'payment_validation_error'
				cb(null,vts);
			}
			
		}
	],function(err,merge){
		next(merge);
	})
}


/*Start:Free Payment*/
exports.free_charge = function(req,res){
	var post = req.body;
	
	async.waterfall([
		function cek_ispaid(cb){
			var order_id = String(post.order_id);
			order_coll.findOne({order_id:order_id},function(err,r){
				if(err){
					debug.log(err)
					debug.log('error commerce line 22')
					cb(null,false,[],{msg:'Payment Has Already Paid',type:'paid'})
				}else{
					if(r == null){
						debug.log('error line 26 commerce')
						cb(null,false,[],{msg:'Payment Has Already Paid',type:'paid'})
					}else{
						if(r.order_status == 'checkout_incompleted'){
							debug.log('cek is paid true')
							cb(null,true,r,[])
						}else{
							debug.log('cek is paid false')
							cb(null,false,[],{msg:'Payment Has Already Paid',type:'paid'})
						}
					}
				}
				
			})
		},
		function cek_quantity(stat,rows_order,ers,cb){
			if(stat == true){
				var ticket_id = rows_order.product_list[0].ticket_id
				tickettypes_coll.findOne({_id:new ObjectId(ticket_id),active:{$ne:false},status:{$ne:'inactive'}},function(err,r){
					if(err){
						debug.log('error line 44 commerce')
						debug.log(err)
						cb(null,false,{msg:'Sorry, this ticket is already unavailable',type:'ticket_list'})
					}else{
						if(r == null){
							debug.log('error line 49 validation commerce')
							cb(null,false,{msg:'Sorry, this ticket is already unavailable',type:'ticket_list'})
						}else{
							if(r.status == 'sold out' || r.quantity == 0){
								cb(null,false,{msg:'Sorry, this ticket is unavailable',type:'ticket_list'})
							}else{
								if(r.quantity >= rows_order.product_list[0].num_buy){
									debug.log('cek quantity true')
									cb(null,true,[])
								}else{
									debug.log('cek quantity false')
									if(r.quantity == 1){
										cb(null,false,{msg:'Sorry, we only have '+r.quantity+' ticket left',type:'ticket_details'})
									}else if(r.quantity > 1){
										cb(null,false,{msg:'Sorry, we only have '+r.quantity+' tickets left',type:'ticket_details'})
									}
								}
							}
						}
					}
				})
			}else{
				cb(null,false,ers)
			}
		},
		function execute(stat,msg_errors,cb){
			if(stat == true){
				paid_free(req,function(dt){
					if(dt == false){
						cb(null,false,{code_error:403});
					}else{
						cb(null,true,dt);
					}
				})
			}else{
				cb(null,false,msg_errors)
			}
		}
	],function(err,stat,et){
		if(stat == false){
			res.json({
				code_error:403,
				msg:et.msg,
				type:et.type
			})
		}else if(stat == true){
			res.json(et)
		}
	})
}

function paid_free(req,next){
	var post = req.body;
	var order_id = String(post.order_id);
	var pay_deposit = post.pay_deposit;
	
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	debug.log('DATA PAYMENT ###########################')
	debug.log(post)
	debug.log('//DATA PAYMENT ###########################')
	
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
						if(r.total_price > 0){
							debug.log("total price not 0 free payment")
							cb(null,false,{code_error:403})
						}else{
							cb(null,true,r);
						}
						
					}
				}
			})
		},
		function is_ticket_exist(stat,dt,cb){
			if(stat == true){
				var cond22 = {
					_id:new ObjectId(dt.product_list[0].ticket_id),
					active:{$ne:false},
					status:'active'
				}
				tickettypes_coll.findOne(cond22,function(err,r){
					if(err){
						debug.log('error line 105 payment commerce')
						cb(null,false,[]);
					}else{
						if(r == null){
							debug.log('error line 109 payment commerce')
							cb(null,false,[]);
						}else{
							if(r.quantity >= dt.product_list[0].num_buy){
								if(dt.product_list[0].ticket_type == 'purchase'){
									if(parseInt(r.total) == 0){
										cb(null,true,dt);
									}else{
										debug.log('payment free ticket purchase total must 0')
										// cb(null,false,[])
										cb(null,true,dt);
									}
								}else{
									cb(null,true,dt);
								}
							}else{
								debug.log('quantity limited')
								cb(null,false,[]);
							}
							
						}
					}
				})
			}else{
				cb(null,false,[]);
			}
		},
		function cek_valid_min_deposit_booking(stat,dt,cb){
			if(stat == true){
				if(dt.product_list[0].ticket_type == 'booking'){
					if(parseInt(pay_deposit) == 0){
						cb(null,true,dt);
					}else{
						debug.log('errorr min deposit required for booking');
						cb(null,false,[]);
					}
				}else{
					cb(null,true,dt);
				}
			}else{
				cb(null,false,[]);
			}
		},
		function merge_data(stat,dtorder,cb){
			debug.log('merging data payment')
			if(stat == true){
				merge_data_free(req,function(dt){
					if(dt == true){
						cb(null,true,dtorder);
					}else{
						debug.log('error line 160 => paymentjs');
						cb(null,false,[])
					}
				})
			}else{
				debug.log('error line 165 => paymentjs');
				cb(null,false,[]);
			}
		},
		function get_promo(stat,dtorder,cb){
			if(stat == true){
				redis.get("order_"+order_id+"_"+dtorder.fb_id+"_credit",function(err,credit){
					if(credit == null){
						debug.log3("data redis credit free null");
						cb(null,false,[],[],[])
					}else{
						redis.get("order_"+order_id+"_"+dtorder.fb_id+"_datacredit",function(err2,datacredit){
							if(datacredit == null){
								debug.log3("data redis datacredit free null");
								cb(null,false,[],[],[])
							}else{
								redis.get("order_"+order_id+"_"+dtorder.fb_id+"_discount",function(err2,discount){
									if(discount == null){
										debug.log3("data redis discount free null");
										cb(null,false,[],[],[])
									}else{
										redis.get("order_"+order_id+"_"+dtorder.fb_id+"_datadiscount",function(err2,datadiscount){
											if(datadiscount == null){
												debug.log3("data redis datadiscount free null");
												cb(null,false,[],[],[])
											}else{
												cb(null,true,dtorder,JSON.parse(credit),JSON.parse(datacredit),JSON.parse(discount),JSON.parse(datadiscount))
											}
										})
									}
								})
								
							}
						})
						
					}
				})
			}else{
				cb(null,false,[],[],[]);
			}
		},
		function update_credit(stat,dtorder,credit,datacredit,discount,datadiscount,cb2){
			if(stat == true){
				var credit_used = parseInt(credit.credit_used)
				async.forEachOf(datacredit,function(v,k,e){
					if(parseInt(credit_used) > 0){
						/*start:updating inviter credit if is_chain = true*/
						inviter_get_credit(v,dtorder,"")
						/*end:updating inviter credit if is_chain = true*/
						
						var value_left = parseFloat(v.rows_data.credit.amount_invitee) - parseFloat(credit_used);
						if(value_left > 0){
							value_left = value_left
							credit_used = 0;
						}else{
							value_left = 0
							credit_used = Math.abs(parseFloat(v.rows_data.credit.amount_invitee) - parseFloat(credit_used))
						}
						
						var cond = {
							fb_id:dtorder.fb_id,
							"promo_code.rules_id":{$in:[new ObjectId(v.rules_id),String(v.rules_id)]}
						}
						var form_upd = {
							$set:{
								"promo_code.$.used":true,
								"promo_code.$.used_by":{
									order_id:dtorder.order_id,
									value_left:value_left
								}
							}
						}
						customers_coll.update(cond,form_upd,function(err){if(err){debug.log3(err)}})
						debug.log3("LOOPING DATA CUST")
						debug.log3(value_left)
						debug.log3(credit_used)
					}
				})
				
				var cond_credit = {fb_id:dtorder.fb_id}
				var form_credit = {
					$set:{
						totcredit_appinvite:credit.credit_left
					},
					$push:{
						activity:{
							rewards:-credit.credit_used,
							type:"promo",
							plot:"credit",
							flow:"out_from_promo",
							logs:{},
							from_fb_id:dtorder.fb_id,
							updated_at:new Date(),
							rules_id:""
						}
					}
				}
				credit_points_coll.update(cond_credit,form_credit,function(err,upd){if(err){debug.log3(err)}})
				cb2(null,true,dtorder,discount,datadiscount)
			}else{
				cb2(null,false,[],[],[])
			}
		},
		function update_discount(stat,dtorder,discount,datadiscount,cb2){
			if(stat == true){
				async.forEachOf(datadiscount,function(v,k,e){
					var cond = {
						_id:new ObjectId(v._id)
					}
					var form_upd = {
						$push:{
							"discount.used_at":{
								fb_id:dtorder.fb_id,
								order_id:dtorder.order_id
							}
						}
					}
					promo_rules_coll.update(cond,form_upd,function(err,upd){
						if(err){
							debug.logdis(err)
						}
					})
				})
				cb2(null,true,dtorder)
			}else{
				cb2(null,false,dtorder)
			}
		},
		function send_notif(stat,dtorder,cb2){
			debug.log('send notif')
			if(stat == true){
				events_detail_coll.findOne({_id:new ObjectId(dtorder.event_id)},function(err,rows_event){
					if(err){
						debug.log(err)
					}else{
						if(rows_event == null){
							
						}else{
							var email_to = [];
							var n = 0;
							email_to.push(dtorder.guest_detail.email)
							email_to.push("orders@jiggieapp.com");
							if(typeof rows_event.organizer != 'undefined' && rows_event.organizer.length > 0){
								async.forEachOf(rows_event.organizer,function(v3,k3,e3){
									email_to.push(v3.email);
								})
							}
							debug.log('USING EMAIL : ')
							debug.log(email_to)
							
							async.forEachOf(email_to,function(v3,k3,e3){
								var vt = new Object();
								vt.payment_type = 'free'
								vt.order_id = order_id
								var form_post = new Object();
								
								form_post.vt = vt;
								// form_post.email_to = dtorder.guest_detail.email;
								form_post.email_to = v3;
								var options = {
									url:'http://127.0.0.1:31456/sendnotif',
									form:form_post
								}
								curl.post(options,function(err,resp,body){
									if(err){
										debug.log(err)
									}
								})
							})
							cb2(null,true);
						}
					}
				})
				
			}else{
				cb2(null,false,[]);
			}
		}
	],function(err,merge){
		if(merge == true){
			var str = '';
			str = {success:true,status:'capture',method:'Free Payment'}
			next(str)
		}else{
			next(false);
		}
	})
}

function merge_data_free(req,next){
	var post = req.body;
	var order_id = post.order_id;
	
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
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
						tickettypes_coll.findOne({_id:new ObjectId(v.ticket_id)},function(err2,r2){
							var quantity_old = r2.quantity;
							if(r2.ticket_type == 'booking'){
								num_buy = 1;
							}else{
								num_buy = v.num_buy;
							}
							var new_qty = parseInt(quantity_old)-parseInt(num_buy);
							
							var form_update = {
								$set:{quantity:new_qty},
								$push:{sold:{order_id:order_id,num_buy:num_buy}}
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
						order_status:'completed',
						payment_status:'paid'
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
/*End:Free Payment*/


function inviter_get_credit(v,dtorder,rows_cust){
	promo_rules_coll.findOne({_id:new ObjectId(v.rules_id)},function(err,rul){
		if(rul.credit.is_chain == true && rul.has_code == true){
			var cek_triger = false
			if(typeof rul.credit.inviter_trigger != "undefined" && rul.credit.inviter_trigger.length > 0){
				async.forEachOf(rul.credit.inviter_trigger,function(vtri,ktri,etri){
					if(vtri == "booking"){cek_triger = true}
				})
			}else{
				cek_triger = false
			}
			
			if(cek_triger == true){
				var inviter_fbid = "";
				async.forEachOf(rul.code,function(vv,kk,ee){
					if(typeof vv.used_at != "undefined" && vv.used_at.length > 0){
						async.forEachOf(vv.used_at,function(vvv,kkk,eee){
							if(vvv.fb_id == dtorder.fb_id){
								inviter_fbid = vv.used_by
							}
						})
					}
				})
				
				var from_val_left = parseInt(rul.credit.amount_inviter)
				customers_coll.findOne({fb_id:inviter_fbid},function(err,rrcust){
					if(rrcust != null){
						if(typeof rrcust.promo_code != "undefined" && rrcust.promo_code.length > 0){
							var ck_inviter_already_get = false;
							async.forEachOf(rrcust.promo_code,function(v3,k3,e3){
								if(v3.rules_id == String(v.rules_id) || v3.rules_id == new ObjectId(v.rules_id)){
									if(typeof v3.get_from_invite != "undefined"){
										async.forEachOf(v3.get_from_invite,function(v4,k4,e4){
											if(v4.from_fb_id == dtorder.fb_id){
												ck_inviter_already_get = true
											}
										})
									}
									if(typeof v3.used_by != "undefined"){
										from_val_left = from_val_left + parseInt(v3.used_by.value_left)
									}
								}
							})
							
							if(ck_inviter_already_get == false){
								var cond12 = {
									fb_id:inviter_fbid,
									"promo_code.rules_id":{$in:[new ObjectId(v.rules_id),String(v.rules_id)]}
								}
								var form_upd12 = {
									$set:{
										"promo_code.$.invitee_code":"get_from_invitee",
										"promo_code.$.used":true,
										"promo_code.$.used_by.value_left":from_val_left
									},
									$push:{
										"promo_code.$.get_from_invite":{
											from_fb_id:dtorder.fb_id,
											value:parseInt(rul.credit.amount_inviter),
											order_id:dtorder.order_id
										}
									}
								}
								
								customers_coll.update(cond12,form_upd12,function(err,upd){if(err){debug.logdis(err)}})
							
						
								credit_points_coll.findOne({fb_id:inviter_fbid},function(err,cre){
									if(cre != null){
										var inviter_points_new = parseInt(rul.credit.amount_inviter);
										if(typeof cre.inviter_points == "undefined" || cre.inviter_points == null){
											inviter_points_new = inviter_points_new;
										}else{
											inviter_points_new = parseInt(cre.inviter_points)+parseInt(inviter_points_new)
										}
										var totcredit_appinvite = parseInt(cre.totcredit_appinvite) + parseInt(rul.credit.amount_inviter);
										credit_points_coll.update({fb_id:inviter_fbid},{
											$set:{
												inviter_points:inviter_points_new,
												totcredit_appinvite:totcredit_appinvite
											},
											$push:{
												activity:{
													rewards:parseInt(rul.credit.amount_inviter),
													type:"promo",
													plot:"credit",
													flow:"get_from_invitee",
													logs:{},
													from_fb_id:dtorder.fb_id,
													updated_at:new Date(),
													rules_id:String(rul._id)
												}
											}
										},function(err,upd){if(err){debug.logdis(err)}})
									}
								})
							
							}else{
								debug.logdis("ERROS 2239 commerce payment")
							}
						}
					}else{
						debug.logdis("ERROS 2241 commerce payment")
					}
				})
			}else{
				debug.logdis("Triger Not Booking")
			}
		}
	})
	return true
}