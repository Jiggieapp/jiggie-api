require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');
var xssFilters = require('xss-filters');
var EmailTemplate = require('email-templates').EmailTemplate;
var randomString = require('random-strings');
var numeral = require('numeral')
var _ = require('underscore')

var Redis  = require("redis");
var redis  = Redis.createClient(6379,"jiggieappsredis.futsnq.0001.apse1.cache.amazonaws.com");
				
exports.index = function(req,res){
	filter_promo(req,function(dt){
		res.json(dt);
	})
}

function filter_promo(req,next){
	var post = JSON.parse(req.body.data);
	
	var fb_id = xssFilters.inHTMLData(post.fb_id);
	var event_id = xssFilters.inHTMLData(post.event_id);
	var ticket_id = xssFilters.inHTMLData(post.product_list[0].ticket_id);
	
	var active_payment = ''
	if(typeof post.last_payment == 'undefined' || post.last_payment == '' || post.last_payment == null){
		active_payment = '';
	}else{
		active_payment = xssFilters.inHTMLData(post.last_payment.payment_type)
	}
	
	async.waterfall([
		function get_rules(cb){
			promo_rules_coll.find({is_active:true}).toArray(function(err,r){
				if(err){
					debug.log2(err)
					debug.log2('error line 27 discount')
					cb(null,false,[],{code_error:403})
				}else if(r.length <= 0){
					debug.log2('error line 30 discount commerce');
					cb(null,false,[],{code_error:204})
				}else{
					cb(null,true,r,{})
				}
			})
		},
		function get_event(stat,rows_rules,code,cb){
			if(stat == true){
				events_detail_coll.findOne({_id:new ObjectId(event_id)},function(err,r){
					if(err){
						debug.log2(err);
						debug.log2('error line 45 discount commerce');
						cb(null,false,[],[],{code_error:403})
					}else if(r == null){
						debug.log2('error line 48 discount commerce');
						cb(null,false,[],[],{code_error:204});
					}else{
						cb(null,true,rows_rules,r,{})
					}
				})
			}else{
				cb(null,false,[],[],code)
			}
		},
		function get_cust(stat,rows_rules,rows_event,code,cb){
			if(stat == true){
				customers_coll.findOne({fb_id:fb_id},function(err,r){
					if(err){
						debug.log2(err);
						debug.log2('error line 72 discount commerce');
						cb(null,false,[],[],[],{code_error:403})
					}else if(r == null){
						debug.log2('error line 74 discount commerce');
						cb(null,false,[],[],[],{code_error:204})
					}else{
						cb(null,true,rows_rules,rows_event,r,{})
					}
				})
			}else{
				cb(null,false,[],[],[],code)
			}
		},
		function filter_data(stat,rows_rules,rows_event,rows_cust,code,cb){
			if(stat == true){
				var data_credit = filter_credit(post,rows_cust,rows_rules,rows_event)
				var data_discount = filter_discount(post,rows_cust,rows_rules,rows_event)
				cb(null,true,rows_rules,rows_event,rows_cust,data_credit,data_discount,code)
			}else{
				cb(null,false,[],[],[],[],[],code)
			}
		},
		function sync_data(stat,rows_rules,rows_event,rows_cust,data_credit,data_discount,code,cb){
			if(stat == true){
				var json_data = post
				json_data.credit = new Object();
				json_data.discount = new Object();
				
				var temp_price = json_data.product_list[0].total_price
				temp_price = parseInt(temp_price) + parseInt(json_data.product_list[0].admin_fee)
				
				if(data_discount.length > 0){
					var ds = 0;
					var tot_discount = 0;
					json_data.discount.data = []
					
					async.forEachOf(data_discount,function(v,k,e){
						var amount_used;
						if(v.discount.amount_type == "fix"){
							amount_used = parseInt(v.discount.amount_discount)
						}else if(v.discount.amount_type == "%"){
							var amount_temp = (parseFloat(temp_price) * parseFloat(v.discount.amount_discount))/100
							if(amount_temp > v.discount.max_amount_discount){
								amount_used = parseInt(v.discount.max_amount_discount)
							}else{
								amount_used = amount_temp;
							}
						}
						
						tot_discount += parseInt(amount_used)
						json_data.discount.data[ds] = new Object()
						json_data.discount.data[ds].name = v.name;
						json_data.discount.data[ds].amount_used = String(amount_used);
						json_data.discount.data[ds].start_date = v.discount.start_date;
						json_data.discount.data[ds].end_date = v.discount.end_date;
						ds++;
					})
					json_data.discount.total_discount = String(tot_discount)
					
					var tot_price_before_discount = 0;				
					var tot_price_after_discount = 0;
					tot_price_before_discount = parseInt(temp_price)
					
					tot_price_after_discount = parseInt(tot_price_before_discount) - parseInt(tot_discount)
				
					json_data.discount.tot_price_before_discount = String(tot_price_before_discount)
					json_data.discount.tot_price_after_discount = String(tot_price_after_discount)
					
					json_data.total_price = String(tot_price_after_discount)
				}else{
					json_data.discount.data = []
					// json_data.discount.data[0] = new Object()
					// json_data.discount.data[0].name = "";
					// json_data.discount.data[0].amount_discount = 0;
					// json_data.discount.data[0].start_date = "";
					// json_data.discount.data[0].end_date = "";
					json_data.discount.total_discount = 0
					
					var tot_price_before_discount = '0';				
					var tot_price_after_discount = '0';
					tot_price_before_discount = String(temp_price)
					tot_price_after_discount = String(temp_price)
					
					json_data.discount.tot_price_before_discount = String(tot_price_before_discount)
					json_data.discount.tot_price_after_discount = String(tot_price_after_discount)
					
					json_data.total_price = String(tot_price_after_discount)
				}
				
				if(data_credit.length > 0){
					var tot_credit = 0;
					async.forEachOf(data_credit,function(v,k,e){
						tot_credit += parseInt(v.rows_data.credit.amount_invitee);
					})
					json_data.credit.tot_credit = String(tot_credit);
					
					if(tot_credit > 0){
						var tax_after_discount = parseInt(json_data.discount.tot_price_after_discount) * parseInt(json_data.product_list[0].tax_percent) / 100
						json_data.total_tax_amount = String(tax_after_discount)
						
						var tot_price_before_credit = parseInt(json_data.discount.tot_price_after_discount) + parseInt(tax_after_discount);
						json_data.credit.tot_price_before_credit = String(tot_price_before_credit);
						
						
						var tot_price_after_credit = parseFloat(tot_price_before_credit)-parseFloat(tot_credit);
						if(tot_price_after_credit > 0){
							tot_price_after_credit = tot_price_after_credit;	
						}else{
							tot_price_after_credit = 0
						}
						json_data.credit.tot_price_after_credit = String(tot_price_after_credit);
						json_data.total_price = String(tot_price_after_credit)
						
						var credit_used = parseInt(tot_price_before_credit)-parseInt(tot_price_after_credit)
						json_data.credit.credit_used = String(credit_used);
						
						
						var credit_left = 0;
						credit_left = parseFloat(tot_credit)-parseFloat(credit_used);
						if(credit_left < 0){
							credit_left = 0
						}
						json_data.credit.credit_left = String(credit_left);
						
						
						
					}else{
						var tot_credit = 0
						var tax_after_discount = parseInt(json_data.discount.tot_price_after_discount) * parseInt(json_data.product_list[0].tax_percent) / 100
						
						var tot_price_before_credit = parseInt(json_data.discount.tot_price_after_discount) + parseInt(tax_after_discount);
						var tot_price_after_credit = parseInt(tot_price_before_credit)-parseInt(tot_credit);
						
						json_data.credit.tot_credit = '0';
						json_data.credit.credit_used = '0'
						json_data.credit.tot_price_before_credit = String(tot_price_before_credit)
						json_data.credit.tot_price_after_credit = String(tot_price_after_credit)
						json_data.credit.credit_left = '0'
						
						json_data.total_tax_amount = String(tax_after_discount)
						json_data.total_price = String(tot_price_after_credit)
					}
				}else{
					var tot_credit = 0
					var tax_after_discount = parseInt(json_data.discount.tot_price_after_discount) * parseInt(json_data.product_list[0].tax_percent) / 100
						
					var tot_price_before_credit = parseInt(json_data.discount.tot_price_after_discount) + parseInt(tax_after_discount);
					var tot_price_after_credit = parseInt(tot_price_before_credit)-parseInt(tot_credit);
					
					json_data.credit.tot_credit = '0';
					json_data.credit.credit_used = '0'
					json_data.credit.tot_price_before_credit = String(tot_price_before_credit)
					json_data.credit.tot_price_after_credit = String(tot_price_after_credit)
					json_data.credit.credit_left = '0'
					
					json_data.total_tax_amount = String(tax_after_discount)
					json_data.total_price = String(tot_price_after_credit)
				}
				
				if(json_data.total_price <= 0){
					json_data.total_price = '0'
				}
				
				/*start:only for tables*/
				if(json_data.product_list[0].ticket_type == "booking"){
					var min_deposit_percent = json_data.product_list[0].min_deposit_percent;
					if(json_data.total_price > 0){
						var price_before_tax = json_data.total_price;
						var min_deposit_amount = parseInt(price_before_tax) * parseInt(min_deposit_percent) / 100;
						json_data.min_deposit_amount = String(min_deposit_amount)
					}else{
						json_data.min_deposit_amount = "0"
					}
					json_data.min_deposit_percent = String(min_deposit_percent)
					
				}else{
					json_data.min_deposit_percent = '0'
					json_data.min_deposit_amount = '0'
				}
				/*end:only for tables*/
				
				redis.set("order_"+post.order_id+"_"+fb_id+"_credit",JSON.stringify(json_data.credit),function(err,suc){
					if(err){debug.log2(err)}else{
						redis.set("order_"+post.order_id+"_"+fb_id+"_datacredit",JSON.stringify(data_credit),function(err,suc){
							if(err){debug.log2(err)}else{
								redis.set("order_"+post.order_id+"_"+fb_id+"_discount",JSON.stringify(json_data.discount),function(err,suc){
									redis.set("order_"+post.order_id+"_"+fb_id+"_datadiscount",JSON.stringify(data_discount),function(err,suc){
										redis.expire("order_"+post.order_id+"_"+fb_id+"_credit",7200);
										redis.expire("order_"+post.order_id+"_"+fb_id+"_datacredit",7200);
										redis.expire("order_"+post.order_id+"_"+fb_id+"_discount",7200);
										redis.expire("order_"+post.order_id+"_"+fb_id+"_datadiscount",7200);
									})
								})
							}
						})
					}
				})
				
				cb(null,true,json_data,{})
			}else{
				cb(null,false,[],code)
			}
		}
	],function(err,stat,json_data,code){
		if(stat == true){
			next(json_data)
		}else{
			next(code);
		}
	})
}

function filter_credit(post,rows_cust,rows_rules,rows_event){
	if(typeof rows_cust.promo_code == 'undefined' || rows_cust.promo_code.length == 0){
		return [];
	}else{
		var data_credit = [];
		var n = 0;
		rows_rules = _.where(rows_rules,{promo_type:"credit"})
		async.forEachOf(rows_cust.promo_code,function(v,k,e){
			if(typeof v.used == 'undefined' || v.used == false){
				/*credit not used*/
				if(new Date() <= v.end_date && v.invitee_code != ''){
					async.forEachOf(rows_rules,function(ve,ke,ee){
						if(String(v.rules_id) == String(ve._id)){
							if(ve.promo_type == "credit"){
								data_credit[n] = new Object();
								data_credit[n].type = v.type;
								data_credit[n].rules_id = v.rules_id;
								data_credit[n].inviter_code = v.inviter_code;
								data_credit[n].invitee_code = v.invitee_code;
								data_credit[n].end_date = v.end_date;
								data_credit[n].rows_data = ve;
								n++;
							}
						}
					})
				}
			}else if(v.used == true){
				/*credit already used*/
				async.forEachOf(rows_rules,function(ve,ke,ee){
					if(String(v.rules_id) == String(ve._id)){
						if(ve.promo_type == "credit"){
							data_credit[n] = new Object();
							data_credit[n].type = v.type;
							data_credit[n].rules_id = v.rules_id;
							data_credit[n].inviter_code = v.inviter_code;
							data_credit[n].invitee_code = v.invitee_code;
							data_credit[n].end_date = v.end_date;
							data_credit[n].rows_data = ve;
							if(typeof data_credit[n].rows_data == "undefined"){
								data_credit[n].rows_data = new Object();
								data_credit[n].rows_data.credit = new Object();
								data_credit[n].rows_data.credit.amount_invitee = v.used_by.value_left
							}else{
								data_credit[n].rows_data.credit.amount_invitee = v.used_by.value_left
							}
							n++;
						}
					}
				})
				
				
				
			}
		})
		return data_credit;
	}
}

function filter_discount(post,rows_cust,rows_rules,rows_event){
	var data_hascode_true = [];var x = 0;
	var data_hascode_false = [];var y = 0;
	
	var data_true = [];var n=0;
	var data_false = [];
	
	var data_use_true = []
	var data_use_false = []
	
	async.forEachOf(rows_rules,function(v,k,e){
		if(v.promo_type == 'discount'){
			if(v.has_code == true){
				data_hascode_true[x] = v;
				x++;
			}else if(v.has_code == false){
				data_hascode_false[y] = v;
				y++;
			}
		}
	})
	
	/* start:handle for has_code false */
	data_hascode_false = _.sortBy(data_hascode_false,function(obj){
		return obj.discount.start_date
	});
	if(data_hascode_false.length > 0){
		data_use_false = filter_target_discount(post,rows_cust,data_hascode_false,rows_event)
	}
	// debug.logdis(data_hascode_false)
	
	/* end:handle for has_code false */
	
	/* start:handle for has_code true */
	if(typeof rows_cust.promo_code != 'undefined' && rows_cust.promo_code.length > 0){
		async.forEachOf(data_hascode_true,function(v,k,e){
			async.forEachOf(rows_cust.promo_code,function(vc,kc,ec){
				if(String(v._id) == String(vc.rules_id)){
					data_true[n] = v;
					n++;
				}
			})
		})
		if(data_true.length > 0){
			data_use_true = filter_target_discount(post,rows_cust,data_true,rows_event)
		}
	}
	/* end:handle for has_code true */
	
	var filter_all = [];
	if(data_use_false.length == 0 && data_use_true.length > 0){
		filter_all = data_use_true
	}else if(data_use_false.length > 0 && data_use_true.length == 0){
		filter_all = data_use_false
	}else if(data_use_false.length > 0 && data_use_true.length > 0){
		filter_all = _.union(data_use_false,data_use_true);
	}
	
	
	var filter_discount_data = [];
	var nr = 0;
	
	if(filter_all.length > 0){
		if(filter_all[0].discount.is_combine == true){
			async.forEachOf(filter_all,function(v,k,e){
				if(v.discount.is_combine == true){
					filter_discount_data[nr] = v
					nr++;
				}
			})
		}else if(filter_all[0].discount.is_combine == false){
			filter_discount_data[0] = filter_all[0]
		}
	}else{
		filter_discount_data = []
	}
	
	return filter_discount_data
}

function filter_target_discount(post,rows_cust,rows_rules,rows_event){
	var check_user = false;
	var check_payment = false;
	var check_all_condition = false;
	var check_category = false;
	var check_event = false;
	var check_ticket = false;
	var check_comb_ticket = false;
	
	var fb_id = xssFilters.inHTMLData(post.fb_id);
	var event_id = xssFilters.inHTMLData(post.event_id);
	var ticket_id = xssFilters.inHTMLData(post.product_list[0].ticket_id);
	var ticket_type = xssFilters.inHTMLData(post.product_list[0].ticket_type);
	
	var data_filter_discount = [];
	var nx = 0;
	
	async.forEachOf(rows_rules,function(v,k,e){
		var is_already_used = false;
		if(typeof v.discount.is_multiple == "undefined" || v.discount.is_multiple == true){
			is_already_used = false
		}else{
			if(typeof v.discount.used_at == 'undefined' || v.discount.used_at.length <= 0){
				is_already_used = false
			}else{
				async.forEachOf(v.discount.used_at,function(v,k,e){
					if(v.fb_id == fb_id){
						is_already_used = true
					}
				})
			}
		}
		
		if(is_already_used == false){
			if(new Date() >= v.discount.start_date && v.discount.end_date >= new Date()){
				async.forEachOf(v.target,function(vt,kt,et){
					/* start:check user */
					if(vt.user[0] == 'all'){
						check_user = true
					}else{
						async.forEachOf(vt.user,function(vuser,kuser,euser){
							if(vuser == fb_id){
								check_user = true
							}
						})
					}
					/* end:check user */
					
					/* start:check category */
					if(vt.category[0] == 'all'){
						check_category = true
					}else if(vt.category.length == 0){
						check_category = false
					}else{
						async.forEachOf(vt.category,function(vcate,kcate,ecate){
							async.forEachOf(rows_event.tags,function(vtags,ktags,etags){
								if(vcate == vtags){
									check_category = true
								}
							})
						})
					}
					/* end:check category */
					
					/* start:check event */
					if(vt.event[0] == 'all'){
						check_event = true
					}else if(vt.event.length == 0){
						check_event = false
					}else{
						async.forEachOf(vt.event,function(vevent,kevent,eevent){
							if(String(vevent) == String(event_id)){
								check_event = true
							}
						})
					}
					/* end:check event */
					
					/* start:check payment */
					if(vt.payment[0] == 'all'){
						check_payment = true
					}else if(vt.payment.length == 0){
						check_payment = false
					}else{
						async.forEachOf(vt.payment,function(vpay,kpay,epay){
							if(vpay == active_payment){
								check_payment = true
							}
						})
					}
					/* end:check payment */
					
					/* start:check ticket / table */
					if(vt.ticket[0] == 'all'){
						check_ticket = true;
					}else if(vt.ticket.length == 0){
						check_ticket = false
					}else{
						async.forEachOf(vt.ticket,function(vtik,ktik,etik){
							if(String(vtik) == String(ticket_id)){
								check_ticket = true;
							}else if(vtik == "tickets"){
								if(ticket_type == "purchase"){
									check_ticket = true;
								}
							}else if(vtik == "tables"){
								if(ticket_type == "booking"){
									check_ticket = true;
								}
							}
						})
					}
					/* end:check ticket / table */
					
					if(check_category == true && check_event == true && check_ticket == true){
						check_comb_ticket = true
					}else{
						check_comb_ticket = false
					}
					
					
					/* start:Check ALL */
					if(v.negate == false){
						if(check_user == true && check_payment == true && check_comb_ticket == true){
							debug.logdis("negate false")
							debug.logdis("name disc "+v.name)
							debug.logdis("id disc "+v._id)
							check_all_condition = true
							data_filter_discount[nx] = v;
							nx++;
						}
					}else if(v.negate == true){
						if(check_user == false && check_payment == false && check_comb_ticket == false){
							debug.logdis("negate true")
							debug.logdis("name disc "+v.name)
							debug.logdis("id disc "+v._id)
							check_all_condition = true
							data_filter_discount[nx] = v;
							nx++;
						}
					}
					
					/* end:Check ALL */
				});
			}
		}else{
			debug.logdis("This Users Already Used Promo")
		}
	})
	
	/*var filter_discount_data = [];
	var nr = 0;
	
	if(data_filter_discount.length > 0){
		if(data_filter_discount[0].discount.is_combine == true){
			async.forEachOf(data_filter_discount,function(v,k,e){
				if(v.discount.is_combine == true){
					filter_discount_data[nr] = v
					nr++;
				}
			})
		}else if(data_filter_discount[0].discount.is_combine == false){
			filter_discount_data[0] = data_filter_discount[0]
		}
	}else{
		filter_discount_data = []
	}
	
	return filter_discount_data*/
	
	return data_filter_discount
}

