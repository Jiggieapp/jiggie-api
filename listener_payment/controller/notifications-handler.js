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

var cron = require('cron').CronJob;

var crypto = require('crypto');
var EmailTemplate = require('email-templates').EmailTemplate
var numeral = require('numeral')

exports.index = function(req, res){
	handling(req,function(stat){
		if(stat == true){
			res.json({cron:true})
		}else{
			res.json({code_error:403});
		}
	})
};

function handling(req,next){
	async.waterfall([
		// cron for handle payment timelimit && for handle notifications transaction has been paid
		function handle_payment_timelimit(cb){
			var job = new cron({
			  cronTime: '*/10 * * * * *',
			  onTick: function() {
				payment_timelimit(req,function(dt){debug.log(dt)})
				payment_vabp(req,function(dt){debug.log(dt)})
			  },
			  start: false,
			  timeZone: 'Asia/Jakarta'
			});
			job.start();
			cb(null,true)
		},
		// cron for handle cancel payment from VT
		/*function handle_cancel_payment_fromVT(stat,cb){
			var job = new cron({
			  cronTime: '1 * * * * *',
			  onTick: function() {
				sync_cancel(req,function(dt){})
			  },
			  start: false,
			  timeZone: 'Asia/Jakarta'
			});
			job.start();
			cb(null,true)
		}*/
	],function(err,merge){
		try{
			next(true);
		}catch(e){
			next(false);
		}
	})	
}

function payment_timelimit(req,next){
	debug.log('Running Payment Payment TimeLimit');
	async.waterfall([
		function get_order(cb){
			var cond = {
				order_status:{$ne:'cancel'},
				$or:[
					{"vt_response.payment_type":'echannel'},
					{"vt_response.payment_type":'bank_transfer'}
				],
				"vt_response.transaction_status":'pending'
			}
			order_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log('line error 59 commerce other');
					debug.log(err);
					cb(null,false,[]);
				}else{
					if(r == null){
						debug.log('error lone 70 commerce other data null');
						cb(null,false,[]);
					}else{
						cb(null,true,r);
					}
				}
			})
		},
		function get_ticket(stat,dt_order,cb){
			if(stat == true){
				var ticketid_in = [];
				var n = 0;
				async.forEachOf(dt_order,function(v,k,e){
					ticketid_in[n] = new ObjectId(v.product_list[0].ticket_id);
				})
				
				tickettypes_coll.find({_id:{$in:ticketid_in}}).toArray(function(err,r){
					if(err){
						debug.log(err);
						debug.log('line error 89 commerce other');
						cb(null,false,[],[])
					}else{
						if(r == null){
							debug.log('line error 92 data null commerce other');
							cb(null,false,[],[])
						}else{
							cb(null,true,dt_order,r);
						}
					}
				})
				
			}else{
				cb(null,false,[],[]);
			}
		},
		function sync_data(stat,dt_order,dt_ticket,cb){
			if(stat == true){
				try{
					async.forEachOf(dt_order,function(v,k,e){
						var timelimit = v.product_list[0].payment_timelimit;
						/*async.forEachOf(dt_ticket,function(ve,ke,ee){
							if(v.product_list[0].ticket_id == ve._id){
								if(typeof ve.payment_timelimit == 'undefined' || ve.payment_timelimit == ''){
									timelimit = 180;
								}else{
									timelimit = ve.payment_timelimit;
								}
							}
						})*/
						
						if(v.created_at_swipetopay == null || typeof v.created_at_swipetopay == 'undefined' || v.created_at_swipetopay == ''){
							
						}else{
							var created_at_plus = req.app.get('helpers').addHours(new Date(v.created_at_swipetopay).getTime(),timelimit);					
							var now = new Date();
								
							if(now > created_at_plus){
								debug.log('TimeLimit : '+timelimit);
								debug.log('Time From DB :'+String(v.created_at_swipetopay));
								debug.log('Time From DB add hours :'+created_at_plus)
								debug.log('Time Now :'+now);
								cancel_transaction(req,v,function(dtrt){})
							}
						}
						
						
						cb(null,true);
					})
				}catch(e){
					debug.log(e);
					// cb(null,false);
				}
			}else{
				cb(null,false);
			}
		}
	],function(err,merge){
		next(merge)
	})
}

function cancel_transaction(req,rows_order,next){
	async.parallel([
		function cancel_vt(cb){
			var options = {
				url:comurl+'/cancel.php',
				form:{
					order_id:rows_order.order_id
				}
			}
			curl.post(options,function(err,resp,body){
				if(!err){
					cb(null,true);
				}else{
					cb(null,false);
				}
			})
		},
		function update_order(cb){
			var cond = {order_id:rows_order.order_id}
			var form_upd = {
				$set:{
					order_status:'cancel',
					payment_status:'expire'
				}
			}
			order_coll.update(cond,form_upd,function(err,upd){
				if(!err){
					cb(null,true);
				}else{
					cb(null,false);
				}
			})
		},
		function update_ticket(cb){
			var cond = {order_id:rows_order.order_id}
			order_coll.findOne(cond,function(err,rt){
				var ticket_id = rt.product_list[0].ticket_id;
				var cond2 = {
					_id:new ObjectId(ticket_id),
					"qty_hold.order_id":rows_order.order_id
				}
				tickettypes_coll.findOne(cond2,function(err,r){
					if(!err && r != null){
						var qty_hold = 0;
						async.forEachOf(r.qty_hold,function(v,k,e){
							if(v.order_id == rows_order.order_id){
								qty_hold = v.qty;
							}
						})
						var new_qty = parseInt(r.quantity) + parseInt(qty_hold);
						debug.log('order_id : '+rows_order.order_id);
						debug.log('qtyhold : '+qty_hold);
						debug.log('old qty : '+r.quantity);
						debug.log('new qty : '+new_qty);
						var form_upd = {
							$set:{quantity:new_qty},
							$pull:{qty_hold:{order_id:rows_order.order_id}}
						}
						tickettypes_coll.update(cond2,form_upd,function(err2,upd){
							if(err2){
								debug.log(err);
							}
						})
						cb(null,true)
					}else{
						cb(null,false);
					}
				})
			})
		},
		function sendmail_cancel(cb){
			var cond = {order_id:rows_order.order_id}
			order_coll.findOne(cond,function(err,r){
				if(!err && r != null){
					var vt = r.vt_response;
					vt.payment_type = 'expire';
					send_mail(req,r.guest_detail.email,vt,function(dt){debug.log(dt)});
				}else{
					cb(null,false);
				}
			})
			
		}
	],function(err,merge){
		next(true);
	})
}

function payment_vabp(req,next){
	debug.log('Running Payment VA BP BCA');
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
	async.waterfall([
		function get_order(cb){
			var cond = {
				mail_status:{$ne:true},
				order_status:'pending_payment',
				payment_status:'awaiting_payment'
			}
			order_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log('line 51');
					debug.log(err);
					cb(null,false,[]);
				}else{
					if(r == null){
						cb(null,false,[]);
					}else{
						cb(null,true,r);
					}
				}
			})
		},
		function sync_with_vt(stat,dt_order,cb2){
			if(stat == true){
				async.forEachOf(dt_order,function(v,k,e){
					if(v.vt_response == null || typeof v.vt_response == 'undefined' || v.vt_response == '' || JSON.stringify(v.vt_response) == '{}'){
						// debug.log('vt response null');
						cb2(null,false);
					}else{
						if(v.vt_response.payment_type == 'bank_transfer' || v.vt_response.payment_type == 'echannel'){
							var options = {
								url:comurl+'status.php',
								form:{
									order_id:v.order_id
								}
							}
							curl.post(options,function(err,resp,body){
								if(err){
									debug.log('error line 77 notif handler');
									debug.log(err);
									cb2(null,false)
								}else{
									var json_data = JSON.parse(body);
									var results = json_data.results;
									
									if(typeof results != 'undefined'){
										if(results.transaction_status == 'settlement'){
											send_mail(req,v.guest_detail.email,results,function(mail_stat){
												if(mail_stat == true){
													// /*update order*/
													var form_upd = {
														$set:{
															mail_status:true,
															order_status:'completed',
															payment_status:'paid',
															vt_response:results
														}
													}
													order_coll.update({order_id:v.order_id},form_upd,function(err,upd){
														if(err){
															debug.log('error line 86 => notif');
															debug.log(err);
														}
													})
													
													/*update tickettype*/
													var num_buy = 0;
													if(v.product_list[0].ticket_type == 'booking'){
														num_buy = 1
													}else{
														num_buy = v.product_list[0].num_buy
													}
													var condt = {
														_id:new ObjectId(v.product_list[0].ticket_id)
													}
													var form_updt = {
														$push:{
															sold:{
																order_id:v.order_id,
																num_buy:num_buy
															}
														},
														$pull:{
															qty_hold:{order_id:v.order_id}
														}
													}
													tickettypes_coll.update(condt,form_updt,function(err3,upd){
														if(err3){
															debug.log('error update sold');
														}else{
															debug.log('updated sold');
														}
													})
												}else{
													debug.log('error line 91 => notif handle');
													debug.log(mail_stat);
												}
											})
										}
									}
								}
							})
						}else{
							debug.log('payment type not bank_transfer or echannel');
							cb2(null,false)
						}
					}
				})
				cb2(null,true);
			}else{
				cb2(null,false);
			}
		}
	],function(err,merge){
		next(merge);
	})
}


function send_mail(req,email_to,vt,next){
	var host = req.app.get('mail_host');
	var port = req.app.get('mail_port');
	var user = req.app.get('mail_user');
	var pass = req.app.get('mail_pass');
	
	var path = require('path')
	var templateDir = path.resolve(__dirname,'../../commerce','views','templates');
	
	var from = 'info@jiggiemail.com';
	var to = email_to;
	var subject = '';
	var html = '';
	
	async.waterfall([
		function get_order(cb){
			order_coll.findOne({order_id:vt.order_id},function(err,rows_order){
				if(err){
					debug.log('error line 388 notif handler js commerce')
					cb(null,false,[]);
				}else{
					if(rows_order == null){
						debug.log('line 391 error rows order data null')
						cb(null,false,[]);
					}else{
						cb(null,true,rows_order)
					}
				}
			})
		},
		function get_customers(stat,rows_order,cb){
			if(stat == true){
				customers_coll.findOne({fb_id:rows_order.fb_id},function(err,rows_cust){
					if(err){
						debug.log('error line 404 notif handler customers')
						cb(null,false,[],[]);
					}else{
						if(rows_cust == null){
							debug.log('error line 407 data cust null');
							cb(null,false,[],[]);
						}else{
							cb(null,true,rows_order,rows_cust)
						}
					}
				})
			}else{
				cb(null,false,[],[]);
			}
		},
		function get_event(stat,rows_order,rows_cust,cb){
			if(stat == true){
				events_detail_coll.findOne({_id:new ObjectId(rows_order.event_id)},function(err,rows_event){
					if(err){
						debug.log('error line 423 commerce notif handler')
						cb(null,false,[],[],[]);
					}else{
						if(rows_event == null){
							debug.log('error line 426 data event null in notif handler')
							cb(null,false,[],[],[]);
						}else{
							cb(null,true,rows_order,rows_cust,rows_event)
						}
					}
					
				})
			}else{
				cb(null,false,[],[],[]);
			}
		},
		function get_instructions(stat,rows_order,rows_cust,rows_event,cb){
			if(stat == true){
				btins_coll.find({}).toArray(function(err,r){
					if(err){
						debug.log('Instruction Coll Err')
						debug.log(err)
						cb(null,false,[],[],[],[])
					}else{
						if(r.length > 0){
							cb(null,true,rows_order,rows_cust,rows_event,r)
						}else{
							debug.log('Instruction Coll Empty')
							cb(null,false,[],[],[],[])
						}
					}
				})
			}else{
				cb(null,false,[],[],[],[])
			}
		},
		function sync_template(stat,rows_order,rows_cust,rows_event,step_payment,cb){
			if(stat == true){
				if(vt.payment_type == 'credit_card'){
					
					if(vt.transaction_status == 'capture'){
						if(rows_order.product_list[0].ticket_type == 'purchase'){
							var is_send = true;
							subject = 'Congrats on Your Booking!';
							var payment_type = 'CREDIT CARD'
							
							var product_name = rows_order.product_list[0].name+' (x'+rows_order.product_list[0].num_buy+')';
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.product_list[0].price*rows_order.product_list[0].num_buy).format('0,0'))
							var total = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							var instructions_event = '';
							if(typeof rows_event.instruction == 'undefined' || rows_event.instruction == null){
								instructions_event = ''
							}else{
								instructions_event = rows_event.instruction
							}
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_order.guest_detail.name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								guest_name:rows_order.guest_detail.name.toUpperCase(),
								status:'PAID',
								payment_method:payment_type,
								event_datetime_word:req.app.get('helpers').parseDate(rows_order.created_at,'DD MMMM YYYY - HH:mm:ss'),
								product_name:product_name,
								product_price:product_price,
								amount_service:amount_service,
								amount_tax:amount_tax,
								total:total,
								instructions:instructions_event
							}
							var template = new EmailTemplate(path.join(templateDir,'purchase','success_screen'))
			
						}else if(rows_order.product_list[0].ticket_type == 'booking'){
							var is_send = true;
							subject = 'Congrats on Your Booking!';
							var payment_type = 'CREDIT CARD'
						
							var product_name = rows_order.product_list[0].name;
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.product_list[0].price).format('0,0'))
							var total_guest = rows_order.product_list[0].num_buy
							
							var amount_estimated = 'Rp. '+String(numeral(rows_order.product_list[0].total_price_all).format('0,0'))
							var amount_deposit = 'Rp. '+String(numeral(rows_order.vt_response.gross_amount).format('0,0'))
							var amount_balance = 'Rp. '+String(numeral(parseInt(rows_order.product_list[0].total_price_all)-parseInt(rows_order.vt_response.gross_amount)).format('0,0'))
							
							var instructions_event = '';
							if(typeof rows_event.instruction == 'undefined' || rows_event.instruction == null){
								instructions_event = ''
							}else{
								instructions_event = rows_event.instruction
							}
							
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_order.guest_detail.name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								guest_name:rows_order.guest_detail.name.toUpperCase(),
								total_guest:total_guest,
								status:'PAID',
								payment_method:payment_type,
								event_datetime_word:req.app.get('helpers').parseDate(rows_order.created_at,'DD MMMM YYYY - HH:mm:ss'),
								product_name:product_name,
								product_price:product_price,
								amount_service:amount_service,
								amount_tax:amount_tax,
								amount_estimated:amount_estimated,
								amount_deposit:amount_deposit,
								amount_balance:amount_balance,
								instructions:instructions_event
							}
							var template = new EmailTemplate(path.join(templateDir,'booking','success_screen'))
						}
						
						
					}
				}else if(vt.payment_type == 'bank_transfer'){
					if(vt.transaction_status == 'settlement'){
						if(rows_order.product_list[0].ticket_type == 'purchase'){
							var is_send = true;
							subject = 'Congrats on Your Booking!';
							if(typeof vt.permata_va_number != 'undefined'){
								var payment_type = 'BANK TRANSFER'
							}else if(typeof vt.va_numbers[0].bank != 'undefined'){
								var payment_type = 'BANK TRANSFER BCA BANK'
							}
						
							var product_name = rows_order.product_list[0].name+' (x'+rows_order.product_list[0].num_buy+')';
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.product_list[0].price*rows_order.product_list[0].num_buy).format('0,0'))
							var total = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							
							var instructions_event = '';
							if(typeof rows_event.instruction == 'undefined' || rows_event.instruction == null){
								instructions_event = ''
							}else{
								instructions_event = rows_event.instruction
							}
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_order.guest_detail.name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								guest_name:rows_order.guest_detail.name.toUpperCase(),
								status:'PAID',
								payment_method:payment_type,
								event_datetime_word:req.app.get('helpers').parseDate(rows_order.created_at,'DD MMMM YYYY - HH:mm:ss'),
								product_name:product_name,
								product_price:product_price,
								amount_service:amount_service,
								amount_tax:amount_tax,
								total:total,
								instructions:instructions_event
							}
							var template = new EmailTemplate(path.join(templateDir,'purchase','success_screen'))
						}else if(rows_order.product_list[0].ticket_type == 'booking'){
							var is_send = true;
							subject = 'Congrats on Your Booking!';
							if(typeof vt.permata_va_number != 'undefined'){
								var payment_type = 'BANK TRANSFER'
							}else if(typeof vt.va_numbers[0].bank != 'undefined'){
								var payment_type = 'BANK TRANSFER BCA BANK'
							}
						
							var product_name = rows_order.product_list[0].name;
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.product_list[0].price).format('0,0'))
							var total_guest = rows_order.product_list[0].num_buy
							
							var amount_estimated = 'Rp. '+String(numeral(rows_order.product_list[0].total_price_all).format('0,0'))
							var amount_deposit = 'Rp. '+String(numeral(rows_order.vt_response.gross_amount).format('0,0'))
							var amount_balance = 'Rp. '+String(numeral(parseInt(rows_order.product_list[0].total_price_all)-parseInt(rows_order.vt_response.gross_amount)).format('0,0'))
							
							var instructions_event = '';
							if(typeof rows_event.instruction == 'undefined' || rows_event.instruction == null){
								instructions_event = ''
							}else{
								instructions_event = rows_event.instruction
							}
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_order.guest_detail.name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								guest_name:rows_order.guest_detail.name.toUpperCase(),
								total_guest:total_guest,
								status:'PAID',
								payment_method:payment_type,
								event_datetime_word:req.app.get('helpers').parseDate(rows_order.created_at,'DD MMMM YYYY - HH:mm:ss'),
								product_name:product_name,
								product_price:product_price,
								amount_service:amount_service,
								amount_tax:amount_tax,
								amount_estimated:amount_estimated,
								amount_deposit:amount_deposit,
								amount_balance:amount_balance,
								instructions:instructions_event
							}
							var template = new EmailTemplate(path.join(templateDir,'booking','success_screen'))
						}
					}else if(vt.transaction_status == 'pending'){
						if(rows_order.product_list[0].ticket_type == 'purchase'){
							var is_send = true;
							subject = 'Congrats on Your Booking! Pending Payment.';
							if(typeof vt.permata_va_number != 'undefined'){
								var payment_type = 'BANK TRANSFER'
								var account_number = vt.permata_va_number;
								var arr_steppayment = []
								async.forEachOf(step_payment,function(v,k,e){
									if(v.channel == 'VA Permata'){
										arr_steppayment = v.data;
									}
								})
							}else if(typeof vt.va_numbers[0].bank != 'undefined'){
								var payment_type = 'BANK TRANSFER BCA BANK'
								var account_number = vt.va_numbers[0].va_number;
								var arr_steppayment = []
								async.forEachOf(step_payment,function(v,k,e){
									if(v.channel == 'VA BCA'){
										arr_steppayment = v.data;
									}
								})
							}
							
							async.forEachOf(arr_steppayment,function(v,k,e){
								var filter_steps = [];
								async.forEachOf(v.steps,function(ve,ke,ee){
									filter_steps.push(ve.replace('{{va_no}}',account_number))
								})
								arr_steppayment[k].steps = filter_steps
							})
						
							var product_name = rows_order.product_list[0].name+' (x'+rows_order.product_list[0].num_buy+')';
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							var total = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							
							var time_limit = parseTimelimit(rows_order.product_list[0].payment_timelimit)
							var amount = 'Rp. '+String(numeral(vt.gross_amount).format('0,0'))
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_order.guest_detail.name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								payment_method:payment_type,
								product_name:product_name,
								time_limit:time_limit,
								amount:amount,
								account_number:account_number,
								step_payment:arr_steppayment
							}
							var template = new EmailTemplate(path.join(templateDir,'purchase','pending'))
						}else if(rows_order.product_list[0].ticket_type == 'booking'){
							var is_send = true;
							subject = 'Congrats on Your Booking! Pending Payment.';
							if(typeof vt.permata_va_number != 'undefined'){
								var payment_type = 'BANK TRANSFER'
								var account_number = vt.permata_va_number;
								var arr_steppayment = []
								async.forEachOf(step_payment,function(v,k,e){
									if(v.channel == 'VA Permata'){
										arr_steppayment = v.data;
									}
								})
							}else if(typeof vt.va_numbers[0].bank != 'undefined'){
								var payment_type = 'BANK TRANSFER BCA BANK'
								var account_number = vt.va_numbers[0].va_number;
								var arr_steppayment = []
								async.forEachOf(step_payment,function(v,k,e){
									if(v.channel == 'VA BCA'){
										arr_steppayment = v.data;
									}
								})
							}
							
							async.forEachOf(arr_steppayment,function(v,k,e){
								var filter_steps = [];
								async.forEachOf(v.steps,function(ve,ke,ee){
									filter_steps.push(ve.replace('{{va_no}}',account_number))
								})
								arr_steppayment[k].steps = filter_steps
							})
						
							var product_name = rows_order.product_list[0].name+' (x'+rows_order.product_list[0].num_buy+')';
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							var total = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							
							var time_limit = parseTimelimit(rows_order.product_list[0].payment_timelimit)
							var amount = 'Rp. '+String(numeral(vt.gross_amount).format('0,0'))
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_order.guest_detail.name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								payment_method:payment_type,
								product_name:product_name,
								time_limit:time_limit,
								amount:amount,
								account_number:account_number,
								step_payment:arr_steppayment
							}
							var template = new EmailTemplate(path.join(templateDir,'booking','pending'))
						}
						
					}
				}else if(vt.payment_type == 'echannel'){
					if(vt.transaction_status == 'settlement'){
						if(rows_order.product_list[0].ticket_type == 'purchase'){
							var is_send = true;
							subject = 'Congrats on Your Booking!';
							var payment_type = 'MANDIRI BILL PAYMENT';
							
							var product_name = rows_order.product_list[0].name+' (x'+rows_order.product_list[0].num_buy+')';
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.product_list[0].price*rows_order.product_list[0].num_buy).format('0,0'))
							var total = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							
							var instructions_event = '';
							if(typeof rows_event.instruction == 'undefined' || rows_event.instruction == null){
								instructions_event = ''
							}else{
								instructions_event = rows_event.instruction
							}
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_order.guest_detail.name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								guest_name:rows_order.guest_detail.name,
								status:'Paid',
								payment_method:payment_type,
								event_datetime_word:req.app.get('helpers').parseDate(rows_order.created_at,'DD MMMM YYYY - HH:mm:ss'),
								product_name:product_name,
								product_price:product_price,
								amount_service:amount_service,
								amount_tax:amount_tax,
								total:total,
								instructions:instructions_event
							}
							var template = new EmailTemplate(path.join(templateDir,'purchase','success_screen'))
						}else if(rows_order.product_list[0].ticket_type == 'booking'){
							var is_send = true;
							subject = 'Congrats on Your Booking!';
							var payment_type = 'MANDIRI BILL PAYMENT';
						
							var product_name = rows_order.product_list[0].name;
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.product_list[0].price).format('0,0'))
							var total_guest = rows_order.product_list[0].num_buy
							
							var amount_estimated = 'Rp. '+String(numeral(rows_order.product_list[0].total_price_all).format('0,0'))
							var amount_deposit = 'Rp. '+String(numeral(rows_order.vt_response.gross_amount).format('0,0'))
							var amount_balance = 'Rp. '+String(numeral(parseInt(rows_order.product_list[0].total_price_all)-parseInt(rows_order.vt_response.gross_amount)).format('0,0'))
							
							var instructions_event = '';
							if(typeof rows_event.instruction == 'undefined' || rows_event.instruction == null){
								instructions_event = ''
							}else{
								instructions_event = rows_event.instruction
							}
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_cust.first_name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								guest_name:rows_order.guest_detail.name,
								total_guest:total_guest,
								status:'Paid',
								payment_method:payment_type,
								event_datetime_word:req.app.get('helpers').parseDate(rows_order.created_at,'DD MMMM YYYY - HH:mm:ss'),
								product_name:product_name,
								product_price:product_price,
								amount_service:amount_service,
								amount_tax:amount_tax,
								amount_estimated:amount_estimated,
								amount_deposit:amount_deposit,
								amount_balance:amount_balance,
								instructions:instructions_event
							}
							var template = new EmailTemplate(path.join(templateDir,'booking','success_screen'))
						}
					}else if(vt.transaction_status == 'pending'){
						if(rows_order.product_list[0].ticket_type == 'purchase'){
							var is_send = true;
							subject = 'Congrats on Your Booking! Pending Payment.';
							var payment_type = 'MANDIRI BILL PAYMENT'
							var account_number = vt.bill_key;
							var company_number = vt.biller_code;
							
							var arr_steppayment = []
							async.forEachOf(step_payment,function(v,k,e){
								if(v.channel == 'VA Mandiri'){
									arr_steppayment = v.data;
								}
							})
							
							async.forEachOf(arr_steppayment,function(v,k,e){
								var filter_steps = [];
								var filter_steps2 = [];
								async.forEachOf(v.steps,function(ve,ke,ee){
									filter_steps.push(ve.replace('{{va_no}}',account_number))
								})
								async.forEachOf(filter_steps,function(ve,ke,ee){
									filter_steps2.push(ve.replace('{{co_no}}',company_number))
								})
								arr_steppayment[k].steps = filter_steps2
							})
						
						
							var product_name = rows_order.product_list[0].name+' (x'+rows_order.product_list[0].num_buy+')';
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							var total = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							
							var time_limit = parseTimelimit(rows_order.product_list[0].payment_timelimit)
							var amount = 'Rp. '+String(numeral(vt.gross_amount).format('0,0'))
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_cust.first_name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								payment_method:payment_type,
								product_name:product_name,
								time_limit:time_limit,
								amount:amount,
								account_number:account_number,
								step_payment:arr_steppayment
							}
							var template = new EmailTemplate(path.join(templateDir,'purchase','pending'))
						}else if(rows_order.product_list[0].ticket_type == 'booking'){
							var is_send = true;
							subject = 'Congrats on Your Booking! Pending Payment.';
							var payment_type = 'MANDIRI BILL PAYMENT'
							var account_number = vt.bill_key;
							var company_number = vt.biller_code;
							
							var arr_steppayment = []
							async.forEachOf(step_payment,function(v,k,e){
								if(v.channel == 'VA Mandiri'){
									arr_steppayment = v.data;
								}
							})
							
							async.forEachOf(arr_steppayment,function(v,k,e){
								var filter_steps = [];
								var filter_steps2 = [];
								async.forEachOf(v.steps,function(ve,ke,ee){
									filter_steps.push(ve.replace('{{va_no}}',account_number))
								})
								async.forEachOf(filter_steps,function(ve,ke,ee){
									filter_steps2.push(ve.replace('{{co_no}}',company_number))
								})
								arr_steppayment[k].steps = filter_steps2
							})
						
							var product_name = rows_order.product_list[0].name+' (x'+rows_order.product_list[0].num_buy+')';
							var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
							var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
							var product_price = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							var total = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
							
							var time_limit = parseTimelimit(rows_order.product_list[0].payment_timelimit)
							var amount = 'Rp. '+String(numeral(vt.gross_amount).format('0,0'))
							
							var parseTo = {
								congrats_title:'Congrats',
								first_name:capitalizeFirstLetter(rows_cust.first_name),
								event_name:rows_event.title,
								event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
								rsvp_no:rows_order.code,
								payment_method:payment_type,
								product_name:product_name,
								time_limit:time_limit,
								amount:amount,
								account_number:account_number,
								step_payment:arr_steppayment
							}
							var template = new EmailTemplate(path.join(templateDir,'booking','pending'))
						}
					}
				}else if(vt.payment_type == 'expire'){
					if(rows_order.vt_response.payment_type == 'bank_transfer'){
						if(typeof vt.permata_va_number != 'undefined'){
							var payment_type = 'BANK TRANSFER'
						}else if(typeof vt.va_numbers[0].bank != 'undefined'){
							var payment_type = 'BANK TRANSFER BCA BANK'
						}
					}else if(rows_order.vt_response.payment_type == 'credit_card'){
						var payment_type = 'CREDIT CARD'
					}else if(rows_order.vt_response.payment_type == 'echannel'){
						var payment_type = 'MANDIRI BILL PAYMENT'
					}
					
					if(rows_order.product_list[0].ticket_type == 'purchase'){
						var is_send = true;
						subject = 'Your Payment Expired';
					
						var product_name = rows_order.product_list[0].name+' (x'+rows_order.product_list[0].num_buy+')';
						var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
						var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
						var product_price = 'Rp. '+String(numeral(rows_order.product_list[0].price*rows_order.product_list[0].num_buy).format('0,0'))
						var total = 'Rp. '+String(numeral(rows_order.total_price).format('0,0'))
						
						var parseTo = {
							congrats_title:'Congrats',
							first_name:capitalizeFirstLetter(rows_cust.first_name),
							event_name:rows_event.title,
							event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
							rsvp_no:rows_order.code,
							guest_name:rows_order.guest_detail.name,
							status:'Expired',
							payment_method:payment_type,
							event_datetime_word:req.app.get('helpers').parseDate(rows_order.created_at,'DD MMMM YYYY - HH:mm:ss'),
							product_name:product_name,
							product_price:product_price,
							amount_service:amount_service,
							amount_tax:amount_tax,
							total:total,
							instructions:'BLA BLA BLA BLA BLA'
						}
						var template = new EmailTemplate(path.join(templateDir,'purchase','expired'))
					}else if(rows_order.product_list[0].ticket_type == 'booking'){
						var is_send = true;
						subject = 'Your Payment Expire';
					
						var product_name = rows_order.product_list[0].name;
						var amount_service = 'Rp. '+String(numeral(rows_order.total_adminfee).format('0,0'))
						var amount_tax = 'Rp. '+String(numeral(rows_order.total_tax_amount).format('0,0'))
						var product_price = 'Rp. '+String(numeral(rows_order.product_list[0].price).format('0,0'))
						var total_guest = rows_order.product_list[0].num_buy
						
						var amount_estimated = 'Rp. '+String(numeral(rows_order.product_list[0].total_price_all).format('0,0'))
						var amount_deposit = 'Rp. '+String(numeral(rows_order.vt_response.gross_amount).format('0,0'))
						var amount_balance = 'Rp. '+String(numeral(parseInt(rows_order.product_list[0].total_price_all)-parseInt(rows_order.vt_response.gross_amount)).format('0,0'))
						
						var parseTo = {
							congrats_title:'Congrats',
							first_name:capitalizeFirstLetter(rows_cust.first_name),
							event_name:rows_event.title,
							event_date:req.app.get('helpers').parseDate(rows_event.start_datetime,'ddd, DD MMM YYYY'),
							rsvp_no:rows_order.code,
							guest_name:rows_order.guest_detail.name,
							total_guest:total_guest,
							status:'Expired',
							payment_method:payment_type,
							event_datetime_word:req.app.get('helpers').parseDate(rows_order.created_at,'DD MMMM YYYY - HH:mm:ss'),
							product_name:product_name,
							product_price:product_price,
							amount_service:amount_service,
							amount_tax:amount_tax,
							amount_estimated:amount_estimated,
							amount_deposit:amount_deposit,
							amount_balance:amount_balance,
							instructions:'BLA BLA BLA BLA BLA'
						}
						var template = new EmailTemplate(path.join(templateDir,'booking','expired'))
					}
				}
				
				cb(null,true,is_send,parseTo,template,subject)
			}else{
				cb(null,false,'',[],[],[])
			}
		},
		function send(stat,is_send,parseTo,template,subject,cb){
			if(stat == true){
				if(is_send == true){
					template.render(parseTo, function (err, results) {
						if(err){
							debug.log('error line 643 sent email commerce');
							debug.log(err)
							cb(null,false);
						}else{
							var nodemailer = require('nodemailer');
							var transporter = nodemailer.createTransport({
								host: host,
								port: port,
								auth: {
									user: user,
									pass: pass
								}
							});
							var mailOptions = {
								from: from, 
								to: to, 
								subject: subject, 
								text: subject, 
								html: results.html
							};
							transporter.sendMail(mailOptions, function(error, info){
								if(error){
									debug.log(error)
									debug.log('error sending mail')
								}else{
									console.log('EMAIL SENT TO '+email_to+' '+info.response)
								}
							});
						}
					})
					cb(null,true)
				}else{
					debug.log('EMAIL NOT ALLOWING');
					cb(null,false)
				}
			}else{
				debug.log('EMAIL NOT SENT');
				cb(null,false)
			}
		}
	],function(err,merge){
		next(true);
	})
}

exports.sendnotif = function(req,res){
	var post = req.body;
	var email_to = post.email_to;
	var vt = post.vt;
	
	send_mail(req,email_to,vt,function(mail_stat){
		if(mail_stat == true){
			res.json({mail:true})
		}else{
			res.json({mail:false})
		}
	})
}

function sync_cancel(req,next){
	async.waterfall([
		function getall_order(cb){
			var cond = {
				// order_status:{$ne:'cancel'},
				order_status:'pending_payment',
				payment_status:'awaiting_payment',
				$or:[
					{"vt_response.payment_type":'bank_transfer'},
					{"vt_response.payment_type":'echannel'},
					{"vt_response.payment_type":'credit_card'}
				]
			}
			order_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log("error line 425 function sync cancel notif handler commerce");
					cb(null,false,[]);
				}else{
					var orderid_arr = [];
					var n = 0;
					async.forEachOf(r,function(v,k,e){
						orderid_arr[n] = v.order_id;
						n++;
					})
					cb(null,true,orderid_arr);
				}
			})
		},
		function get_status_vt(stat,orderid_arr,cb){
			if(stat == true){
				if(orderid_arr.length > 0){
					var options = {
						url:'https://commerce.jiggieapp.com/VT/production/status_all.php',
						form:{
							order_id:orderid_arr
						}
					}
					curl.post(options,function(err,resp,body){
						if(!err && resp.statusCode == 200){
							var all_statusdata = JSON.parse(body);
							cb(null,true,all_statusdata);
						}else{
							debug.log('error line 973 cron commerce')
							debug.log(err)
							cb(null,false,[])
						}
					})
				}else{
					cb(null,false,[])
				}
			}else{
				cb(null,false,[]);
			}
		},
		function cek_status(stat,all_statusdata,cb){
			if(stat == true){
				var orderid_cancel = [];
				var n = 0;
				async.forEachOf(all_statusdata,function(v,k,e){
					if(v.transaction_status == 'cancel'){
						orderid_cancel[n] = v.order_id;
						n++;
					}
				})
				if(orderid_cancel.length > 0){
					cb(null,true,orderid_cancel);
				}else{
					debug.log('No Data to Void From Sync Cancel');
					cb(null,false,[]);
				}
			}else{
				cb(null,false,[]);
			}
		},
		function update_tocancel(stat,orderid_cancel,cb){
			if(stat == true){
				updating_tocancel(orderid_cancel,function(li){
					if(li == true){
						cb(null,true);
					}else{
						cb(null,false);
					}
				})
			}else{
				cb(null,false);
			}
		},
		
	],function(err,stat){
		next(stat);
	})
	
}

function updating_tocancel(orderid_cancel,next){
	async.waterfall([
		function getall_order(cb){
			var cond = {
				order_id:{$in:orderid_cancel}
			}
			order_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log('error line 517 commerce notif');
					debug.log(err);
				}else{
					cb(null,true,r);
				}
			})
		},
		function updating(stat,dtorder,cb){
			if(stat == true){
				var ticket_id = '';
				async.forEachOf(dtorder,function(v,k,e){
					order_coll.update({_id:new ObjectId(v._id)},{
						$set:{
							order_status:'cancel',
							payment_status:'void'
						}
					},function(err,upd){
						if(!err){
							ticket_id = v.product_list[0].ticket_id;
							var cond2 = {
								_id:new ObjectId(ticket_id),
								"qty_hold.order_id":v.order_id
							}
							tickettypes_coll.findOne(cond2,function(err,r){
								if(!err && r != null){
									var qty_hold = 0;
									async.forEachOf(r.qty_hold,function(ve,ke,ee){
										if(ve.order_id == v.order_id){
											qty_hold = ve.qty;
										}
									})
									var new_qty = parseInt(r.quantity) + parseInt(qty_hold);
									debug.log('order_id : '+v.order_id);
									debug.log('qtyhold : '+qty_hold);
									debug.log('old qty : '+r.quantity);
									debug.log('new qty : '+new_qty);
									var form_upd = {
										$set:{quantity:new_qty},
										$pull:{qty_hold:{order_id:v.order_id}}
									}
									tickettypes_coll.update(cond2,form_upd,function(err2,upd){
										if(err2){
											debug.log(err);
										}
									})	
								}
							})
						}
					})
				})
				cb(null,true);
			}else{
				cb(null,false);
			}
		}
	],function(err,stat){
		next(stat);
	})
	
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function parseTimelimit(tm){
	var m = tm%60;
	var h = parseInt(tm/60)
	return h+'h '+m+' m';
}