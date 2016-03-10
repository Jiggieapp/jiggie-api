require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var request = require('request');

var randomString = require('random-strings');



exports.index = function(req, res){
	get_data(req,function(data){
		if(data == 0){
			res.json({code_error:204})
		}else{
			res.json(data);
		}
	})
};

function get_data(req,next){
	var event_id = req.params.event_id;
	
	async.waterfall([
		function get_eventdetails(cb){
			events_detail_coll.findOne({_id:new ObjectId(event_id)},function(err,r){
				if(err){
					cb(null,0);
				}else{
					if(r != null){
						if(r.fullfillment_type == 'ticket'){
							cb(null,1);
						}else{
							cb(null,0);
						}
					}else{
						cb(null,2);
					}
				}
			})
		},
		function get_eventdetails(cek,cb){
			if(cek == 1){
				events_detail_coll.findOne({_id:new ObjectId(event_id)},function(err,r){
					cb(null,1,r)
				});
			}else{
				cb(null,0,[]);
			}
		},
		function get_ticket(cek,rows_event,cb){
			if(cek == 1){
				tickettypes_coll.find({event_id:event_id}).toArray(function(err,r){
					if(r.length > 0){
						var json_data = new Object();
						json_data.event_id = event_id;
						json_data.event_name = rows_event.title;
						json_data.venue_name = rows_event.venue_name;
						json_data.start_datetime = rows_event.start_datetime;
						json_data.purchase = []
						json_data.reservation = []
						var n = 0;
						var m = 0;
						async.forEachOf(r,function(v,k,e){
							if(v.ticket_type == 'purchase'){
								json_data.purchase[n] = new Object();
								json_data.purchase[n].ticket_id = v._id;
								json_data.purchase[n].name = v.name;
								json_data.purchase[n].ticket_type = v.ticket_type;
								json_data.purchase[n].quantity = v.quantity;
								json_data.purchase[n].admin_fee = v.admin_fee;
								json_data.purchase[n].tax_percent = v.tax;
								json_data.purchase[n].tax_amount = v.tax_amount;
								json_data.purchase[n].tip_percent = v.tip;
								json_data.purchase[n].tip_amount = v.tip_amount;
								json_data.purchase[n].price = v.price;
								json_data.purchase[n].currency = v.currency;
								json_data.purchase[n].total_price = v.total;
								json_data.purchase[n].description = v.description;
								json_data.purchase[n].max_purchase = v.guest;
								if(typeof v.payment_timelimit == 'undefined'){
									json_data.purchase[n].payment_timelimit = 180;
								}else{
									json_data.purchase[n].payment_timelimit = v.payment_timelimit;
								}
								n++;
							}else if(v.ticket_type == 'reservation'){
								json_data.reservation[m] = new Object();
								json_data.reservation[m].ticket_id = v._id;
								json_data.reservation[m].name = v.name;
								json_data.reservation[m].ticket_type = v.ticket_type;
								json_data.reservation[m].quantity = v.quantity;
								json_data.reservation[m].admin_fee = v.admin_fee;
								json_data.reservation[m].tax_percent = v.tax;
								json_data.reservation[m].tax_amount = v.tax_amount;
								json_data.reservation[m].tip_percent = v.tip;
								json_data.reservation[m].tip_amount = v.tip_amount;
								json_data.reservation[m].price = v.price;
								json_data.reservation[m].currency = v.currency;
								json_data.reservation[m].total_price = v.total;
								json_data.reservation[m].description = v.description;
								json_data.reservation[m].max_guests = v.guest;
								if(typeof v.payment_timelimit == 'undefined'){
									json_data.reservation[m].payment_timelimit = 180;
								}else{
									json_data.reservation[m].payment_timelimit = v.payment_timelimit;
								}
								m++;
							}
						})
						cb(null,json_data);
					}else{
						cb(null,0)
					}
				})
			}else{
				cb(null,0);
			}
		}
	],function(err,merge){
		next(merge);
	})
	
	
}


exports.post_summary = function(req,res){
	get_summary(req,function(data){
		res.json(data);
	})
}

function get_summary(req,next){
	var fb_id = req.body.fb_id;
	
	async.waterfall([
		function post(cb){
			customers_coll.findOne({fb_id:fb_id},function(err,r){
				if(r == null){
					debug.log('error fbid');
					cb(null,false,{code_error:403})
				}else{
					post_summary(req,function(data){
						if(data == false){
							cb(null,false,{code_error:403});
						}else if(data == 0){
							cb(null,false,{code_error:204});
						}else{
							cb(null,true,data)
						}
					})
				}
			})
			
		},
		function get_purchase_confirmation(stat,dt,cb){
			if(stat == false){
				cb(null,false,dt)
			}else if(stat == true){
				var ticket_id_in = [];
				var x = 0;
				async.forEachOf(dt.product_list,function(v,k,e){
					ticket_id_in[x] = new ObjectId(v.ticket_id);
					x++;
				})
				
				tickettypes_coll.find({_id:{$in:ticket_id_in}}).toArray(function(err,r){
					var conf = [];
					async.forEachOf(r,function(v,k,e){
						conf[v._id] = v.purchase_confirmations;
					})
					
					async.forEachOf(dt.product_list,function(v,k,e){
						if(typeof conf[v.ticket_id] != 'undefined'){
							dt.product_list[k].terms = conf[v.ticket_id];
						}else{
							dt.product_list[k].terms = [];
						}
						
					})
					cb(null,true,dt)
				})
			}
		},
		function get_cc(stat,dt,cb){
			if(stat == false){
				cb(null,dt)
			}else if(stat == true){
				customers_coll.findOne({fb_id:fb_id},function(err,r){
					if(r == null){
						debug.log('error fbid');
						cb(null,{code_error:403})
					}else{
						if(r.credit_card_vt == null){
							dt.credit_card = [];
						}else{
							dt.credit_card = r.credit_card_vt
						}
						cb(null,dt);
					}
				})
			}
		}
	],function(err,merge){
		next(merge)
	})
}

function post_summary(req,next){
	var schema = req.app.get('mongo_path');
	var order = require(schema+'/order_product.js');
	var post = req.body;
	
	async.waterfall([
		function get_ticketdata(cb){
			var in_ticketid = [];
			var n = 0;
			async.forEachOf(post.product_list,function(v,k,e){
				in_ticketid[n] = new ObjectId(v.ticket_id);
			})
			tickettypes_coll.find({_id:{$in:in_ticketid}}).toArray(function(err,r){
				async.forEachOf(r,function(v,k,e){
					async.forEachOf(post.product_list,function(ve,ke,ee){
						if(v._id == ve.ticket_id){
							v.num_buy = ve.num_buy;
							v.guest_detail = ve.guest_detail;
							v.ticket_id = ve.ticket_id;
						}
					})
				})
				debug.log(r);
				cb(null,true,r)
			})
		},
		function get_event(stat,rows_ticket,cb){
			if(stat == true){
				events_detail_coll.findOne({_id:new ObjectId(post.event_id)},function(err,r){
					if(r != null){
						cb(null,true,r,rows_ticket)
					}else{
						cb(null,false,[],[]);
					}
				});
			}else{
				cb(null,false,[],[])
			}
			
		},
		function syncdata(cek,rows_event,rows_ticket,cb){
			if(cek == true){
				var json_data = new Object();
		
				json_data.code = String(randomString.alphaNumUpper(6,new Date().getTime()));
				json_data.order_status = 'checkout_completed';
				json_data.payment_status = 'awaiting_payment';
				json_data.order_id = new Date().getTime();;
				json_data.fb_id = post.fb_id;
				json_data.event_id = post.event_id;
				json_data.event_name = rows_event.title;
				
				var n = 0;
				var totall = 0;
				var tottax = 0;
				var totadminfee = 0;
				var tottip = 0;
				
				var tot_tax = 0;
				var tot_tip = 0;
				var tot_price = 0;
				var total_price_aftertax = 0;
				var tot_price_all = 0;
				json_data.product_list = [];
				async.forEachOf(rows_ticket,function(v,k,e){
					tot_tax = parseFloat(v.tax_amount)*parseInt(v.num_buy);
					tot_tip = parseFloat(v.tip_amount)*parseInt(v.num_buy);
					var mata_uang;(typeof v.currency == 'undefined') ? mata_uang = 'IDR' : mata_uang = v.currency;
					tot_price = parseFloat(v.price)*parseInt(v.num_buy);
					total_price_aftertax = parseFloat(v.price)+parseFloat(v.tax_amount)+(parseFloat(v.admin_fee)/parseFloat(v.num_buy))+parseFloat(v.tip_amount);
					tot_price_all = tot_price + tot_tax + tot_tip + parseFloat(v.admin_fee);
					
					json_data.product_list[n] = new Object();
					json_data.product_list[n].ticket_id = String(v.ticket_id);
					json_data.product_list[n].name = String(v.name);
					json_data.product_list[n].ticket_type = String(v.ticket_type);
					json_data.product_list[n].max_buy = String(v.guest);
					json_data.product_list[n].quantity = String(v.quantity);
					json_data.product_list[n].admin_fee = String(v.admin_fee);
					json_data.product_list[n].tax_percent = String(v.tax);
					json_data.product_list[n].tax_amount = String(tot_tax);
					json_data.product_list[n].tip_percent = String(v.tip);
					json_data.product_list[n].tip_amount = String(tot_tip);
					json_data.product_list[n].price = String(v.price);
					json_data.product_list[n].currency = String(mata_uang);
					json_data.product_list[n].total_price = String(tot_price);
					json_data.product_list[n].total_price_aftertax = String(total_price_aftertax);
					json_data.product_list[n].num_buy = String(v.num_buy);
					json_data.product_list[n].total_price_all = String(tot_price_all);
					json_data.product_list[n].terms = v.purchase_confirmations;
					if(typeof v.payment_timelimit == 'undefined'){
						json_data.product_list[n].payment_timelimit = 180;
					}else{
						json_data.product_list[n].payment_timelimit = v.payment_timelimit;
					}
					
					
					tottax += tot_tax;
					totadminfee += parseFloat(v.admin_fee);
					tottip += tot_tip;
					totall += tot_price_all;
					n++;
				})
				json_data.guest_detail = post.guest_detail;
				json_data.total_tax_amount = String(tottax);
				json_data.total_tip_amount = String(tottip);
				json_data.total_adminfee = String(totadminfee);
				json_data.total_price = String(totall);
				cb(null,true,json_data,rows_ticket);
			}else{
				cb(null,false,[],[]);
			}
		},
		function cek(cek,json_data,rows_ticket,cb){
			if(cek == true){
				var cek_exist = true;
				var cek_quantity = true;
				var cek_type = true;
				var cek_max = true;
				
				var n = 0;
				var in_ticketid = [];
				var temp_type = rows_ticket[0].ticket_type;
				var temp_quantity = [];
				async.forEachOf(rows_ticket,function(v,k,e){
					if(temp_type != v.ticket_type){
						cek_type = false
					}
					in_ticketid[n] = new ObjectId(v.ticket_id);
					temp_quantity[v.ticket_id] = v.num_buy;
					n++;
				})
				
				tickettypes_coll.find({_id:{$in:in_ticketid}}).toArray(function(err,dt){
					if(err){
						debug.log(err);
						debug.log('error lone 285=>product list');
						cb(null,[],false,false,false)
					}else{
						if(dt.length > 0){
							async.forEachOf(dt,function(v,k,e){
								if(v.quantity < temp_quantity[v._id]){
									cek_quantity = false;
								}
							})
						}else{
							debug.log('error lone 296=>product list');
							cek_exist = false;
						}
						
						cb(null,1,json_data,cek_exist,cek_quantity,cek_type)
					}
				})
			}else{
				cb(null,0,'','','','');
			}
		},
		function post_data(cek,json_data,cek_exist,cek_quantity,cek_type,cb){
			if(cek == 1){
				debug.log('cek_exist : '+cek_exist);
				debug.log('cek_quantity : '+cek_quantity);
				debug.log('cek_type : '+cek_type);
				if(cek_exist == true && cek_quantity == true && cek_type == true){
					var insert = new order(json_data);
					insert.save(function(err){
						if(err){debug.log(err);}else{
							cb(null,json_data)
						}
					})
				}else{
					cb(null,false);
				}
			}else{
				cb(null,0);
			}
		}
		
	],function(err,merge){
		next(merge);
	})
}



