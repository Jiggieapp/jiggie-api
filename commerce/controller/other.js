require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');

exports.cc_info = function(req,res){
	get_ccinfo(req,function(stat,data){
		if(stat == true){
			res.json(data);
		}else{
			res.json(data);
		}
	})
}

function get_ccinfo(req,next){
	var fb_id = req.params.fb_id;
	
	async.waterfall([
		function get_customers(cb){
			customers_coll.findOne({fb_id:fb_id},function(err,r){
				if(err){
					debug.log('error data line 21=>otherjs commerce')
					cb(null,false,[]);
				}else{
					if(r == null){
						debug.log('data customers null=>others commerce');
						cb(null,false,{code_error:204});
					}else{
						cb(null,true,r);
					}
				}
			})
		},
		function get_ccinfo(stat,rc,cb){
			if(stat == true){
				if(rc.cc_info == null || typeof rc.cc_info == 'undefined'){
					debug.log('Error Data 36=>other.js=>commerce');
					cb(null,false,{code_error:204});
				}else{
					cb(null,true,rc.cc_info);
				}
			}else{
				debug.log('Error Data 42=>other.js=>commerce');
				cb(null,false,rc);
			}
		}
	],function(err,stat,data){
		try{
			if(stat == true){
				next(true,data)
			}else{
				debug.log('error line 51-> otherjs->commerce')
				next(false,data);
			}
		}catch(e){
			debug.log(e);
			next(false,{code_error:403});
		}
	})
	
}

exports.post_cc = function(req,res){
	var fb_id = req.body.fb_id;
	var token_id = req.body.token_id;
	var card_id = req.body.card_id;
	
	async.waterfall([
		function get_cc(cb){
			var cond = {
				fb_id:fb_id,
				"cc_info.card_id":card_id
			}
			
			customers_coll.findOne(cond,function(err,r){
				if(err){
					debug.log('error line 81 commerce other')
					debug.log(err)
					cb(null,false)
				}else{
					debug.log(r);
					if(r == null){
						cb(null,true)
					}else{
						debug.log('data cc already exist')
						cb(null,false)
					}
				}
			})
		},
		function updating(stat,cb){
			if(stat == true){
				var cond2 = {fb_id:fb_id}
				var data_push = {
					card_id:card_id,
					token_id:token_id,
					is_verified:false,
					created_at:new Date()
				} 
				customers_coll.update(cond2,{$push:{cc_info:data_push}},function(err,upd){
					if(err){
						debug.log('error line 105 commerce other')
						debug.log(err);
						cb(null,false)
					}else{
						cb(null,true)
					}
				})
			}else{
				debug.log('error line 113 other commerce js')
				cb(null,false)
			}
		}
	],function(err,merge){
		if(merge == false){
			res.json({code_error:403})
		}else{
			res.json({success:true})
		}
		
	})
}

exports.delete_cc = function(req,res){
	var fb_id = req.body.fb_id;
	var masked_card = req.body.masked_card;
	
	async.waterfall([
		function upd_ccinfo(cb){
			customers_coll.update(
			{
				fb_id:fb_id,
				"cc_info.masked_card":masked_card
			},{
				$pull:{
					cc_info:{masked_card:masked_card}
				}
			},function(err,upd){
				if(err){
					cb(null,false);
				}else{
					if(upd){
						cb(null,true);
						// res.json({success:true});
					}else{
						cb(null,false);
						// res.json({code_error:403})
					}
				}
			})
		},
		function pull_lastpayment(stat,cb){
			if(stat == true){
				customers_coll.findOne({fb_id:fb_id},function(err,r){
					if(r.last_cc != null && typeof r.last_cc != 'undefined'){
						if(r.last_cc.masked_card == masked_card){
							customers_coll.update({fb_id:fb_id},{$set:{last_cc:{}}},function(){})
						}
					}
					cb(null,true);
				})
			}else{
				cb(null,false);
			}
		}
	],function(err,data){
		res.json({success:true});
	})
}

exports.order_list = function(req,res){
	orderlist(req,function(stat,data){
		if(stat == false){
			res.json({code_error:403});
		}else{
			res.json(data);
		}
	})
}

function orderlist(req,next){
	var fb_id = req.params.fb_id;
	async.waterfall([
		function get_order(cb){
			var cond = {
				fb_id:fb_id,
				order_status:{$ne:'checkout_incompleted'}
			}
			order_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log('error otherjs commerce line 71');
					debug.log(err);
					cb(null,false,[]);
				}else{
					cb(null,true,r)
				}
			})
		},
		function get_event(stat,dt_order,cb){
			if(stat == true){
				var in_eventid = [];
				var n = 0;
				async.forEachOf(dt_order,function(v,k,e){
					in_eventid[n] = new ObjectId(v.event_id);
					n++;
				})
				events_detail_coll.find({_id:{$in:in_eventid}}).toArray(function(err,r){
					if(err){
						debug.log('err lone 101 commerce other');
						debug.log(err);
						cb(null,false,[],[]);
					}else{
						cb(null,true,dt_order,r)
					}
				})
			}else{
				cb(null,false,[],[]);
			}
		},
		function sync_data(stat,dt_order,dt_event,cb){
			if(stat == true){
				var json_data = [];
				var n = 0;
				async.forEachOf(dt_order,function(v,k,e){
					delete v.vt_response;
					delete v.__v;
					delete v.mail_status;
					async.forEachOf(dt_event,function(ve,ke,ee){
						delete ve.guests_viewed;
						delete ve.viewed;
						if(v.event_id == ve._id){
							json_data[n] = new Object();
							json_data[n].order = v;
							json_data[n].event = ve;
							json_data[n].created_at = v.created_at;
							n++;
						}
					})
				})
				json_data = json_data.sort(sortDate);
				cb(null,true,json_data);
			}else{
				cb(null,false,[]);
			}
		}
	],function(err,stat,data){
		try{
			if(stat == true){
				next(true,data);
			}else{
				next(false,[]);
			}
		}catch(e){
			debug.log('error lone 115 commerce other')
			debug.log(e);
			next(false,[]);
		}
	})
}

var sortDate = function (a, b){
	if(a.created_at == undefined)
	{
		a.created_at = new Date(2000,0,1);
	}
	if(b.created_at == undefined)
	{
		b.created_at = new Date(2000,0,1);
	}
	if (a.created_at < b.created_at) return 1;
	if (a.created_at > b.created_at) return -1;
	
	return 0;
}

exports.success_screen = function(req,res){
	get_success_screen(req,function(data){
		if(data == false){
			res.json({code_error:403})
		}else{
			res.json(data);
		}
	})
}

function get_success_screen(req,next){
	var order_id = req.params.order_id;
	var cond = {
		order_id:order_id,
		$or:[
			{order_status:'completed'},
			{order_status:'pending_payment'},
			{order_status:'cancel'}
		]
		
	}
	async.waterfall([
		function get_order(cb){
			order_coll.findOne(cond,function(err,r){
				if(!err && r != null){
					delete r.__v;
					delete r.mail_status;
					cb(null,true,r)
				}else{
					debug.log('')
					cb(null,false,[])
				}
			})
		},
		function get_event(stat,rorder,cb){
			if(stat == true){
				events_detail_coll.findOne({_id:new ObjectId(rorder.event_id)},function(err,r){
					if(!err && r != null){
						delete r.photos;
						delete r.viewed;
						delete r.guests_viewed;
						cb(null,true,rorder,r);
					}else{
						debug.log('error line 174 other commerce');
						cb(null,false,[],[])
					}
				})
			}else{
				debug.log('error line 179 other commerce');
				cb(null,false,[],[]);
			}
		},
		function get_cust(stat,rorder,revent,cb){
			if(stat == true){
				customers_coll.findOne({fb_id:rorder.fb_id},function(err,r){
					cb(null,true,rorder,revent,r)
				})
				
			}else{
				debug.log('error line 327 other commerce');
				cb(null,false,[],[],[])
			}
			
		},
		function get_instructions(stat,rorder,revent,rcust,cb){
			if(stat == true){
				btins_coll.find({}).toArray(function(err,r){
					if(err){
						cb(null,false,[],[],[],[])
					}else{
						if(r.length > 0){
							cb(null,true,rorder,revent,rcust,r)
						}else{
							cb(null,false,[],[],[],[])
						}
					}
				})
			}else{
				cb(null,false,[],[],[],[])
			}
		},
		function sync_data(stat,rorder,revent,rcust,step_payment,cb){
			if(stat == true){
				if(typeof rorder.vt_response == 'undefined' || rorder.vt_response == null || rorder.vt_response == ''){
					var type = 'free';
					var template = template_success_screen(req,rorder,revent,rcust,type,step_payment,'success');
					cb(null,true,template);
				}else{
					var type = '';
					if(rorder.vt_response.payment_type == 'bank_transfer'){
						if(rorder.vt_response.transaction_status == 'pending'){
							if(typeof rorder.vt_response.permata_va_number != 'undefined'){
								type = 'va_pending';
							}else if(typeof rorder.vt_response.va_numbers[0].bank != 'undefined'){
								type = 'bca_pending'
							}
						}else if(rorder.vt_response.transaction_status == 'settlement'){
							if(typeof rorder.vt_response.permata_va_number != 'undefined'){
								type = 'va_success';
							}else if(typeof rorder.vt_response.va_numbers[0].bank != 'undefined'){
								type = 'bca_success'
							}
						}else if(rorder.order_status == 'cancel'){
							type = 'va_pending';
						}
					}else if(rorder.vt_response.payment_type == 'echannel'){
						if(rorder.vt_response.transaction_status == 'pending'){
							type = 'bp_pending';
						}else if(rorder.vt_response.transaction_status == 'settlement'){
							type = 'bp_success';
						}else if(rorder.order_status == 'cancel'){
							type = 'bp_pending';
						}
					}else if(rorder.vt_response.payment_type == 'credit_card'){
						type = 'cc';
					}
					var template = template_success_screen(req,rorder,revent,rcust,type,step_payment,'success');
					cb(null,true,template);
				}
			}else{
				debug.log('error line 195 other commerce');
				cb(null,false,[])
			}
		}
	],function(err,stat,template){
		try{
			if(stat == true){
				next(template);
			}else{
				next(false)
			}
		}catch(e){
			debug.log('catch error line 226 other commerce');
			next(false);
		}
	})
}

exports.walkthrough_payment = function(req,res){
	async.waterfall([
		function get_ins(cb){
			btins_coll.find({}).toArray(function(err,r){
				if(err){
					cb(null,false,[])
				}else{
					if(r.length > 0){
						cb(null,true,r)
					}else{
						cb(null,false,[])
					}
				}
			})
		},
		function sync_data(stat,step_payment,cb){
			if(stat == true){
				var va_step = template_success_screen(req,[],'',[],'va_pending',step_payment,'walkthrough_payment');
				var bp_step = template_success_screen(req,[],'',[],'bp_pending',step_payment,'walkthrough_payment');
				var bca_step = template_success_screen(req,[],'',[],'bca_pending',step_payment,'walkthrough_payment');
				var json_data = new Object();
				json_data.va_step = va_step;
				json_data.bp_step = bp_step;
				json_data.bca_step = bca_step;
				cb(null,true,json_data)
			}else{
				cb(null,false,[])
			}
		}
	],function(err,stat,json_data){
		if(stat == true){
			res.json(json_data)
		}else if(stat == false){
			res.json({code_error:403})
		}
	})
}

function template_success_screen(req,rorder,revent,rcust,type,step_payment,stat){
	var json_data = new Object();
	if(typeof rorder.credit == "undefined"){
		rorder.credit = new Object();
		rorder.credit.tot_credit = 0
		rorder.credit.credit_used = 0
		rorder.credit.tot_price_before_credit = 0
		rorder.credit.tot_price_after_credit = 0
		rorder.credit.credit_left = 0
	}
	
	if(typeof rorder.discount == "undefined"){
		rorder.discount = new Object();
		rorder.discount.data = [];
		rorder.discount.tot_price_before_discount = 0
		rorder.discount.tot_price_after_discount = 0
	}
	
	if(stat == 'success'){
		json_data.order_id = rorder.order_id;
		json_data.order_number = rorder.code;
		json_data.order_status = rorder.order_status;
		json_data.payment_status = rorder.payment_status;
		json_data.first_name = rcust.first_name;
		json_data.last_name = rcust.last_name;
	}
	json_data.type = type;
	
	
	if(type == 'bca_pending'){
		json_data.payment_type = 'bca';
		json_data.credit = rorder.credit;
		json_data.discount = rorder.discount;
		if(stat == 'success'){
			json_data.payment_timelimit = rorder.product_list[0].payment_timelimit;
			json_data.created_at = rorder.created_at_swipetopay;
			json_data.timelimit = req.app.get('helpers').addHours(new Date(rorder.created_at_swipetopay).getTime(),rorder.product_list[0].payment_timelimit);
			
			if(rorder.product_list[0].ticket_type == 'booking'){
				json_data.amount = parseInt(rorder.vt_response.gross_amount);
			}else if(rorder.product_list[0].ticket_type == 'purchase'){
				json_data.amount = parseInt(rorder.total_price);
			}
			json_data.transfer_to = rorder.vt_response.va_numbers[0].va_number;
		}
		
		var arr_steppayment = []
		async.forEachOf(step_payment,function(v,k,e){
			if(v.channel == 'VA BCA'){
				arr_steppayment = v.data;
			}
		})
		
		async.forEachOf(arr_steppayment,function(v,k,e){
			var filter_steps = [];
			async.forEachOf(v.steps,function(ve,ke,ee){
				if(stat == 'success'){
					filter_steps.push(ve.replace('{{va_no}}',rorder.vt_response.va_numbers[0].va_number))
				}else{
					filter_steps.push(ve.replace('{{va_no}}','Virtual Number'))
				}
			})
			arr_steppayment[k].steps = filter_steps
		})
		
		// bca //
		json_data.step_payment = arr_steppayment;
		json_data.summary = rorder;
		
	}else if(type == 'bca_success'){
		json_data.payment_type = 'bca';
		json_data.credit = rorder.credit;
		json_data.discount = rorder.discount;
		
		json_data.event = revent;
		
		if(rorder.product_list[0].ticket_type == 'booking'){
			rorder.pay_deposit = parseInt(rorder.vt_response.gross_amount);
			json_data.summary = rorder;
		}else if(rorder.product_list[0].ticket_type == 'purchase'){
			json_data.summary = rorder;
		}
		
		if(typeof revent.instruction == 'undefined' || revent.instruction == null){
			json_data.instructions = ''
		}else{
			json_data.instructions = revent.instruction
		}
		
		json_data.ticket_include = [];
		json_data.ticket_include[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		
		json_data.fine_print = [];
		json_data.fine_print[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
	}else if(type == 'va_pending'){
		json_data.payment_type = 'va';
		json_data.credit = rorder.credit;
		json_data.discount = rorder.discount;
		if(stat == 'success'){
			json_data.payment_timelimit = rorder.product_list[0].payment_timelimit;
			json_data.created_at = rorder.created_at_swipetopay;
			json_data.timelimit = req.app.get('helpers').addHours(new Date(rorder.created_at_swipetopay).getTime(),rorder.product_list[0].payment_timelimit);
			
			if(rorder.product_list[0].ticket_type == 'booking'){
				json_data.amount = parseInt(rorder.vt_response.gross_amount);
			}else if(rorder.product_list[0].ticket_type == 'purchase'){
				json_data.amount = parseInt(rorder.total_price);
			}
			
			json_data.transfer_to = rorder.vt_response.permata_va_number;
		}
		
		var arr_steppayment = []
		async.forEachOf(step_payment,function(v,k,e){
			if(v.channel == 'VA Permata'){
				arr_steppayment = v.data;
			}
		})
		
		async.forEachOf(arr_steppayment,function(v,k,e){
			var filter_steps = [];
			async.forEachOf(v.steps,function(ve,ke,ee){
				if(stat == 'success'){
					filter_steps.push(ve.replace('{{va_no}}',rorder.vt_response.permata_va_number))
				}else{
					filter_steps.push(ve.replace('{{va_no}}','Virtual Number'))
				}
			})
			arr_steppayment[k].steps = filter_steps
		})
		
		// va //
		json_data.step_payment = arr_steppayment;
		json_data.summary = rorder;
		
	}else if(type == 'va_success'){
		json_data.payment_type = 'va';
		json_data.credit = rorder.credit;
		json_data.discount = rorder.discount;
		json_data.event = revent;
		
		if(rorder.product_list[0].ticket_type == 'booking'){
			rorder.pay_deposit = parseInt(rorder.vt_response.gross_amount);
			json_data.summary = rorder;
		}else if(rorder.product_list[0].ticket_type == 'purchase'){
			json_data.summary = rorder;
		}
		
		
		if(typeof revent.instruction == 'undefined' || revent.instruction == null){
			json_data.instructions = ''
		}else{
			json_data.instructions = revent.instruction
		}
		
		json_data.ticket_include = [];
		json_data.ticket_include[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		
		json_data.fine_print = [];
		json_data.fine_print[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
	}else if(type == 'bp_pending'){
		json_data.payment_type = 'bp';
		json_data.credit = rorder.credit;
		json_data.discount = rorder.discount;
		if(stat == 'success'){
			json_data.payment_timelimit = rorder.product_list[0].payment_timelimit;
			json_data.created_at = rorder.created_at_swipetopay;
			json_data.timelimit = req.app.get('helpers').addHours(new Date(rorder.created_at_swipetopay).getTime(),rorder.product_list[0].payment_timelimit);
			
			if(rorder.product_list[0].ticket_type == 'booking'){
				json_data.amount = parseInt(rorder.vt_response.gross_amount);
			}else if(rorder.product_list[0].ticket_type == 'purchase'){
				json_data.amount = parseInt(rorder.total_price);
			}
			
			json_data.transfer_to = rorder.vt_response.bill_key;
		}
		
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
				if(stat == 'success'){
					filter_steps.push(ve.replace('{{va_no}}',rorder.vt_response.bill_key))
				}else{
					filter_steps.push(ve.replace('{{va_no}}','Bill Key'))
				}
				
			})
			async.forEachOf(filter_steps,function(ve,ke,ee){
				if(stat == 'success'){
					filter_steps2.push(ve.replace('{{co_no}}',rorder.vt_response.biller_code))
				}else{
					filter_steps2.push(ve.replace('{{co_no}}','Company Code'))
				}
				
			})
			arr_steppayment[k].steps = filter_steps2
		})
		
		json_data.step_payment = arr_steppayment;
		json_data.summary = rorder;
		
	}else if(type == 'bp_success'){
		json_data.payment_type = 'bp';
		json_data.credit = rorder.credit;
		json_data.discount = rorder.discount;
		
		json_data.event = revent;
		if(rorder.product_list[0].ticket_type == 'booking'){
			rorder.pay_deposit = parseInt(rorder.vt_response.gross_amount);
			json_data.summary = rorder;
		}else if(rorder.product_list[0].ticket_type == 'purchase'){
			json_data.summary = rorder;
		}
		
		if(typeof revent.instruction == 'undefined' || revent.instruction == null){
			json_data.instructions = ''
		}else{
			json_data.instructions = revent.instruction
		}
		
		json_data.ticket_include = [];
		json_data.ticket_include[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		
		json_data.fine_print = [];
		json_data.fine_print[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
	}else if(type == 'cc'){
		json_data.payment_type = 'cc';
		json_data.credit = rorder.credit;
		json_data.discount = rorder.discount;
		
		json_data.event = revent;
		if(rorder.product_list[0].ticket_type == 'booking'){
			rorder.pay_deposit = parseInt(rorder.vt_response.gross_amount);
			json_data.summary = rorder;
		}else if(rorder.product_list[0].ticket_type == 'purchase'){
			json_data.summary = rorder;
		}
		
		if(typeof revent.instruction == 'undefined' || revent.instruction == null){
			json_data.instructions = ''
		}else{
			json_data.instructions = revent.instruction
		}
		
		json_data.ticket_include = [];
		json_data.ticket_include[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		
		json_data.fine_print = [];
		json_data.fine_print[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
	}else if(type == 'free'){
		json_data.payment_type = 'free';
		json_data.credit = rorder.credit;
		json_data.discount = rorder.discount;
		
		json_data.event = revent;
		if(rorder.product_list[0].ticket_type == 'booking'){
			rorder.pay_deposit = parseInt(0);
			json_data.summary = rorder;
		}else if(rorder.product_list[0].ticket_type == 'purchase'){
			json_data.summary = rorder;
		}
		
		if(typeof revent.instruction == 'undefined' || revent.instruction == null){
			json_data.instructions = ''
		}else{
			json_data.instructions = revent.instruction
		}
		
		json_data.ticket_include = [];
		json_data.ticket_include[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.ticket_include[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		
		json_data.fine_print = [];
		json_data.fine_print[0] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[1] = "Lorem Ipsum copy in various charsets and langauges for layouts";
		json_data.fine_print[2] = "Lorem Ipsum copy in various charsets and langauges for layouts";
	}
	return json_data;
}

exports.get_paymentmethod = function(req,res){
	payment_method_coll.find({status:true}).toArray(function(err,r){
		res.json(r)
	})
}

exports.support = function(req,res){
	support_coll.find({}).toArray(function(err,r){
		delete r[0]._id;
		res.json(r[0])
	})
}

exports.guest_info = function(req,res){
	var fb_id = req.params.fb_id
	
	var countries        = require('country-data').countries,
    currencies       = require('country-data').currencies,
    regions          = require('country-data').regions,
    languages        = require('country-data').languages,
    callingCountries = require('country-data').callingCountries;
	
	order_coll.find({fb_id:fb_id}).sort({created_at:-1}).toArray(function(err,r){
		if(!err){
			if(r.length > 0){
				var last_data = r[0];
				res.json(last_data.guest_detail)
			}else{
				res.json({
					"email": "",
					"name": "",
					"dial_code": "",
					"phone": ""
				})
			}
		}
	})
}

exports.handle_cancel_vt = function(req,res){
	var post = req.body;
	var json_data;
	
	async.forEachOf(post,function(v,k,e){
		jsondata = JSON.parse(k)
	})
	
	// if(jsondata.transaction_status == 'cancel'){
		// var order_id = jsondata.order_id;
		// async.waterfall([
			// function get_order(cb){
				// order_coll.findOne({order_id:order_id},function(err,r){
					// if(err){
						// debug.log(err)
						// cb(null,false,[])
					// }else{
						// cb(null,true,r)
					// }
				// })
			// },
			// function update_order(stat,rows_order,cb){
				// if(stat == true){
					// var cond = {
						// order_id:order_id
					// }
					// var form_upd = {
						// $set:{
							// order_status:'cancel',
							// vt_response:jsondata
						// }
					// }
					// order_coll.update(cond,form_upd,function(err,upd){
						// if(!err){
							// cb(null,true,rows_order)
						// }else{
							// cb(null,false,[])
						// }
					// })
				// }else{
					// cb(null,false,[])
				// }
			// },
			// function update_ticket(stat,rows_order,cb){
				// if(stat == true){
					// var ticket_id = rows_order.product_list[0].ticket_id;
					// tickettypes_coll.findOne({_id:new ObjectId(ticket_id)},function(err,r){
						// if(err){
							// cb(null,false)
						// }else{
							// var get_numbuy = 0;
							// async.forEachOf(r.sold,function(v,k,e){
								
							// })
							// async.forEachOf(r.sold,function(v,k,e){
								
							// })
						// }
					// })
				// }else{
					// cb(null,false)
				// }
			// }
		// ],function(){
			
		// })
	// }
	
	res.json({success:true})
}