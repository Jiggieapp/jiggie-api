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
		function get_venue(cek,rows_event,cb){
			if(cek == 1){
				venues_coll.findOne({_id:new ObjectId(rows_event.venue_id)},function(err,r){
					if(err){
						cb(null,0,[],[])
					}else{
						if(r == null){
							cb(null,0,[],[])
						}else{
							cb(null,1,rows_event,r)
						}
					}
				})
			}else{
				cb(null,0,[],[])
			}
		},
		function get_ticket(cek,rows_event,rows_venue,cb){
			if(cek == 1){
				var cond1 = {
					event_id:event_id,
					active:{$ne:false},
					status:{$ne:'inactive'}
				}
				tickettypes_coll.find(cond1).toArray(function(err,r){
					if(r.length > 0){
						var json_data = new Object();
						json_data.event_id = event_id;
						json_data.event_name = rows_event.title;
						json_data.venue_name = rows_event.venue_name;
						json_data.venue_city = rows_venue.city;
						json_data.start_datetime = rows_event.start_datetime;
						json_data.end_datetime = rows_event.end_datetime;
						json_data.tags = rows_event.tags;
						json_data.description = rows_event.description;
						json_data.photos = rows_event.photos;
						
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
								json_data.purchase[n].summary = v.summary;
								json_data.purchase[n].status = v.status;
								n++;
							}else if(v.ticket_type == 'booking'){
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
								json_data.reservation[m].min_deposit_percent = v.deposit;
								json_data.reservation[m].min_deposit_amount = String((parseFloat(v.total_num)/100)*parseFloat(v.deposit))
								if(typeof v.payment_timelimit == 'undefined'){
									json_data.reservation[m].payment_timelimit = 180;
								}else{
									json_data.reservation[m].payment_timelimit = v.payment_timelimit;
								}
								json_data.reservation[m].summary = v.summary;
								json_data.reservation[m].status = v.status;
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
	var post = req.body;
	async.waterfall([
		function cek_quantity(cb){
			var ticket_id = post.product_list[0].ticket_id
			var num_buy = post.product_list[0].num_buy
			tickettypes_coll.findOne({_id:new ObjectId(ticket_id),active:{$ne:false},status:{$ne:'inactive'}},function(err,r){
				if(err){
					debug.log(err)
					debug.log('error line 150 commerce productlist')
					cb(null,false,{msg:'Ticket Is Not Available'})
				}else{
					if(r == null){
						debug.log('error line 156 commerce productlist')
						cb(null,false,{msg:'Sorry, this ticket is already unavailable',type:'ticket_list'})
					}else{
						if(r.status == 'sold out'){
							msg = {msg:'Sorry, this ticket is unavailable',type:'ticket_list'}
							cb(null,false,msg)
						}else{
							if(r.quantity >= num_buy){
								
								// cek acl fbid permission //
								var exist_fbid = false;
								if(typeof r.fb_id_acl == 'undefined' || r.fb_id_acl == ''){
									exist_fbid = true
								}else{
									async.forEachOf(r.fb_id_acl,function(v,k,e){
										if(v == post.fb_id){
											exist_fbid = true
										}else{
											exist_fbid = false
										}
									})
								}
								// cek acl fbid permission //
								
								if(exist_fbid == true){
									cb(null,true,[])
								}else{
									msg = {msg:'Sorry, this ticket is unavailable',type:'ticket_list'}
									cb(null,false,msg)
								}
								
							}else{
								
								
								var msg = '';
								if(r.quantity == 1){
									msg = {msg:'Sorry, we only have '+r.quantity+' ticket left',type:'ticket_details'}
								}else if(r.quantity > 1){
									msg = {msg:'Sorry, we only have '+r.quantity+' tickets left',type:'ticket_details'}
								}else if(r.quantity <=0){
									msg = {msg:'Sorry, this ticket is unavailable',type:'ticket_list'}
								}
								cb(null,false,msg)
							}
						}
					}
				}
			})
		},
		function execute(stat,msg,cb){
			if(stat == true){
				get_summary(req,function(data){
					cb(null,true,data)
				})
			}else{
				cb(null,false,msg)
			}
		}
	],function(err,stat,data){
		if(stat == true){
			res.json(data)
		}else if(stat == false){
			res.json({
				code_error:403,
				msg:data.msg,
				type:data.type
			})
		}
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
						if(r.last_cc == null){
							dt.last_payment = {};
						}else{
							dt.last_payment = r.last_cc
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
		function get_ticketdata(callback){
			var in_ticketid = [];
			var n = 0;
			async.forEachOf(post.product_list,function(v,k,e){
				in_ticketid[n] = new ObjectId(v.ticket_id);
			})
			tickettypes_coll.find({_id:{$in:in_ticketid},active:{$ne:false},status:'active'}).toArray(function(err,r){
				if(r == null || typeof r == 'undefined' || r.length <= 0){
					callback(null,false,[])
				}else{
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
					callback(null,true,r)
				}
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
				json_data.order_status = 'checkout_incompleted';
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
					json_data.product_list[n] = new Object();
					
					var mata_uang;(typeof v.currency == 'undefined') ? mata_uang = 'IDR' : mata_uang = v.currency;
					if(v.ticket_type == 'purchase'){
						tot_tax = parseFloat(v.tax_amount)*parseInt(v.num_buy);
						tot_tip = parseFloat(v.tip_amount)*parseInt(v.num_buy);
						tot_price = parseFloat(v.price)*parseInt(v.num_buy);
						total_price_aftertax = parseFloat(v.price)+parseFloat(v.tax_amount)+(parseFloat(v.admin_fee)/parseFloat(v.num_buy))+parseFloat(v.tip_amount);
						tot_price_all = tot_price + tot_tax + tot_tip + parseFloat(v.admin_fee);
						
						json_data.product_list[n].max_buy = String(v.guest);
					}else if(v.ticket_type == 'booking'){
						tot_tax = parseFloat(v.tax_amount);
						tot_tip = parseFloat(v.tip_amount);
						tot_price = parseFloat(v.price);
						total_price_aftertax = parseFloat(v.total_num);
						tot_price_all = parseFloat(v.total_num);
						
						
						
						json_data.product_list[n].min_deposit_percent = String(v.deposit);
						json_data.product_list[n].min_deposit_amount = String((parseFloat(v.total_num)/100)*parseFloat(v.deposit))
					}
					
					
					json_data.product_list[n].ticket_id = String(v.ticket_id);
					json_data.product_list[n].name = String(v.name);
					json_data.product_list[n].ticket_type = String(v.ticket_type);
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
						json_data.product_list[n].payment_timelimit = String(v.payment_timelimit);
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
						
						if(rows_ticket.ticket_type == 'purchase'){
							if(json_data.product_list[0].num_buy > json_data.product_list[0].max_buy){
								cek_max = false;
							}else{
								cek_max = true;
							}
						}
						
						cb(null,1,json_data,cek_exist,cek_quantity,cek_type,cek_max)
					}
				})
			}else{
				cb(null,0,'','','','','');
			}
		},
		function post_data(cek,json_data,cek_exist,cek_quantity,cek_type,cek_max,callback){
			if(cek == 1){
				debug.log('cek_exist : '+cek_exist);
				debug.log('cek_quantity : '+cek_quantity);
				debug.log('cek_type : '+cek_type);
				debug.log('cek_max : '+cek_max);
				if(cek_exist == true && cek_quantity == true && cek_type == true && cek_max == true){
					var insert = new order(json_data);
					insert.save(function(err){
						if(err){debug.log(err);}else{
							callback(null,json_data)
						}
					})
				}else{
					callback(null,false);
				}
			}else{
				callback(null,0);
			}
		}
		
	],function(err,merge){
		next(merge);
	})
}



