require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');

var comurl = 'https://commerce.jiggieapp.com/VT/production/';
var cron = require('cron').CronJob;

var crypto = require('crypto');

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
	async.parallel([
		// cron for handle notifications transaction has been paid
		function handle_va_bp(cb){
			var job = new cron({
			  cronTime: '*/30 * * * * *',
			  onTick: function() {
				get_status(req,function(dt){
					debug.log('listener va bp has been paid running');
					// debug.log(dt);
				})
			  },
			  start: true,
			  timeZone: 'Asia/Jakarta'
			});
			job.start();
			cb(null,true)
		},
		// cron for handle payment timelimit
		function handle_payment_timelimit(cb){
			var job = new cron({
			  cronTime: '*/10 * * * * *',
			  onTick: function() {
				payment_timelimit(req,function(dt){
					debug.log('listener payment timelimit running');
					// debug.log(dt);
				})
			  },
			  start: true,
			  timeZone: 'Asia/Jakarta'
			});
			job.start();
			cb(null,true)
		},
		// cron for handle cancel payment from VT
		function handle_cancel_payment_fromVT(cb){
			var job = new cron({
			  cronTime: '1 * * * * *',
			  onTick: function() {
				sync_cancel(req,function(dt){
					debug.log('listener handle_cancel_payment_fromVT running');
					// debug.log(dt);
				})
			  },
			  start: true,
			  timeZone: 'Asia/Jakarta'
			});
			job.start();
			cb(null,true)
		}
	],function(err,merge){
		try{
			next(true);
		}catch(e){
			next(false);
		}
	})	
}

function payment_timelimit(req,next){
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
					var timelimit;
					async.forEachOf(dt_order,function(v,k,e){
						async.forEachOf(dt_ticket,function(ve,ke,ee){
							if(v.product_list[0].ticket_id == ve._id){
								if(typeof ve.payment_timelimit == 'undefined' || ve.payment_timelimit == ''){
									timelimit = 180;
								}else{
									timelimit = ve.payment_timelimit;
								}
								
							}
						})
						
						var created_at_plus = req.app.get('helpers').addHours(new Date(v.created_at).getTime(),timelimit);					
						var now = new Date();
						
						debug.log('TimeLimit : '+timelimit);
						debug.log('Time From DB :'+String(v.created_at));
						debug.log('Time From DB add hours :'+created_at_plus)
						debug.log('Time Now :'+now);
							
						if(now > created_at_plus){
							debug.log('udah lewat');
							cancel_transaction(req,v,function(dtrt){})
						}else{
							debug.log('blum lewat');
						}
						cb(null,true);
					})
				}catch(e){
					debug.log(e);
					cb(null,false);
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
				url:'https://commerce.jiggieapp.com/VT/production/cancel.php',
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
					var vt = new Object();
					vt.payment_type = 'cancel';
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

function get_status(req,next){
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	
	async.waterfall([
		function get_order(cb){
			var cond = {
				mail_status:{$ne:true}
			}
			order_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log('line 51');
					debug.log(err);
					cb(null,false,[]);
				}else{
					cb(null,true,r);
				}
			})
		},
		function sync_with_vt(stat,dt_order,cb){
			if(stat == true){
				async.forEachOf(dt_order,function(v,k,e){
					if(typeof v.vt_response == 'undefined' || v.vt_response == '' || JSON.stringify(v.vt_response) == '{}'){
						debug.log('vt response null');
						cb(null,false)
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
								}else{
									var json_data = JSON.parse(body);
									var results = json_data.results;
									// debug.log(results);
									if(results.transaction_status == 'settlement'){
										send_mail(req,v.guest_detail.email,results,function(mail_stat){
											if(mail_stat == true){
												/*update order*/
												var form_upd = {
													$set:{
														mail_status:true,
														order_status:'completed',
														payment_status:'paid',
														vt_response:results,
														qty_hold:0
													}
												}
												order_coll.update({order_id:v.order_id},form_upd,function(err,upd){
													if(err){
														debug.log('error line 86 => notif');
														debug.log(err);
													}
												})
												
												/*update tickettype*/
												var condt = {
													_id:new ObjectId(v.product_list[0].ticket_id)
												}
												var form_updt = {
													$push:{
														sold:{
															order_id:v.order_id,
															num_buy:v.product_list[0].num_buy
														}
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
							})
						}else{
							debug.log('payment type not bank_transfer or echannel');
						}
					}
				})
				cb(null,true)
			}else{
				cb(null,false);
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
	
	var from = 'cto@jiggieapp.com';
	var to = email_to;
	var subject = '';
	var html = '';
	
	if(vt.payment_type == 'credit_card'){
		if(vt.transaction_status == 'capture'){
			subject = 'Thanks For Yout Credit Card Payment';
			html = '<html><strong>Testing Sukses Pembayaran Menggunakan Credit Card</strong></html>';
		}
	}else if(vt.payment_type == 'bank_transfer'){
		if(vt.transaction_status == 'settlement'){
			subject = 'Your VA Payment Already Success';
			html = '<html><strong>Testing Success Pembayaran Menggunakan Bank Transfer</strong></html>';
		}else if(vt.transaction_status == 'pending'){
			subject = 'Your VA Payment Pending';
			html = '<html><strong>Testing Pending Pembayaran Menggunakan Bank Transfer</strong></html>';
		}
	}else if(vt.payment_type == 'echannel'){
		if(vt.transaction_status == 'settlement'){
			subject = 'Your BP Payment Already Success';
			html = '<html><strong>Testing Success Pembayaran Menggunakan Echannel</strong></html>';
		}else if(vt.transaction_status == 'pending'){
			subject = 'Your BP Payment Pending';
			html = '<html><strong>Testing Pending Pembayaran Menggunakan Echannel</strong></html>';
		}
	}else if(vt.payment_type == 'cancel'){
		subject = 'Your Payment Cancel';
		html = '<html><strong>Testing Cancel Pembayaran</strong></html>';
	}
	
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
		html: html
	};
	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			debug.log('error sending mail')
			next(error);
		}else{
			debug.log('EMAIL SENT TO '+email_to+' '+info.response)
			next(true);
		}
	});
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
				order_status:{$ne:'cancel'},
				$or:[
					{"vt_response.payment_type":'bank_transfer'},
					{"vt_response.payment_type":'echannel'}
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
				var options = {
					url:'https://commerce.jiggieapp.com/VT/production/status_all.php',
					form:{
						order_id:orderid_arr
					}
				}
				curl.post(options,function(err,resp,body){
					if(!err){
						var all_statusdata = JSON.parse(body);
						cb(null,true,all_statusdata);
					}
				})
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