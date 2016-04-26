require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var _ = require('underscore')

exports.venue = function(req, res){
	var post = req.body;
	var venue_ids = post.venue_ids;
	
	var object_venue_ids = []
	var n = 0;
	async.forEachOf(venue_ids,function(v,k,e){
		object_venue_ids[n] = new ObjectId(v);
		n++;
	})
	
	async.waterfall([
		function get_event(cb){
			var cond = {
				venue_id:{$in:venue_ids},
				fullfillment_type:"ticket"
			}
			events_detail_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log(err);
					debug.log('error line 26 admin')
					cb(null,false,[])
				}else{
					if(r.length == 0){
						debug.log('error line 30 admin')
						cb(null,false,[])
					}else{
						cb(null,true,r)
					}
				}
			})
		},
		function get_ticket(stat,rows_event,cb){
			if(stat == true){
				var event_ids = [];
				var n = 0;
				async.forEachOf(rows_event,function(v,k,e){
					event_ids[n] = String(v._id)
					n++;
				})
				
				var cond = {
					event_id:{$in:event_ids},
					active:{$ne:false}
				}
				tickettypes_coll.find(cond).toArray(function(err,r){
					if(err){
						debug.log(err);
						debug.log('error line 53 admin')
						cb(null,false,[],[])
					}else{
						if(r.length == 0){
							debug.log('error line 57 admin')
							cb(null,false,[],[])
						}else{
							async.forEachOf(r,function(v,k,e){
								async.forEachOf(rows_event,function(ve,ke,ee){
									if(v.event_id == ve._id){
										r[k].venue_id = ve.venue_id
									}
								})
							})
							cb(null,true,rows_event,r)
						}
					}
				})
			}else{
				cb(null,false,[],[])
			}
		},
		function sync_data(stat,rows_event,rows_ticket,cb){
			if(stat == true){
				var tmp = _.groupBy(rows_ticket,function(d){
					return d['venue_id']
				})
				
				var final_results = []
				var n = 0;
				async.forEachOf(tmp,function(v,k,e){
					var num_bookings_sold = 0;
					var num_bookings_hold = 0;
					async.forEachOf(v,function(ve,ke,ee){
						if(typeof ve.sold != 'undefined'){
							num_bookings_hold += ve.qty_hold.length
						}
						if(typeof ve.sold != 'undefined'){
							num_bookings_sold += ve.sold.length
						}
					})
					var num_bookings = num_bookings_sold+num_bookings_hold;
					final_results[n] = {venue_id:v[0].venue_id,count : num_bookings}
					n++
				})
				cb(null,true,final_results)
				
			}else{
				cb(null,false,[])
			}
		}
	],function(err,stat,merge_data){
		if(stat == true){
			res.json(merge_data)
		}else{
			res.json({code_error:403})
		}
	})
};


exports.admin_event = function(req,res){
	var post = req.body;
	var event_ids = post.event_ids;
	
	async.waterfall([
		function get_ticket(cb){
			var cond = {
				event_id:{$in:event_ids},
				active:{$ne:false}
			}
			tickettypes_coll.find(cond).toArray(function(err,r){
				if(err){
					debug.log('error line 124 admin')
					debug.log(err)
					cb(null,false,[])
				}else{
					if(r.length == 0){
						debug.log('error line 129 admin')
						debug.log(err)
						cb(null,false,[])
					}else{
						cb(null,true,r)
					}
				}
			})
		},
		function get_order(stat,rows_ticket,cb){
			if(stat == true){
				var order_id_sold = [];				
				var order_id_hold = [];
				var n = 0
				var m = 0
				async.forEachOf(rows_ticket,function(v,k,e){
					if(typeof v.sold != 'undefined'){
						if(v.sold.length != 0){
							async.forEachOf(v.sold,function(vs,ks,es){
								order_id_sold[n] = vs.order_id;
								n++;
							})
						}
					}
					if(typeof v.qty_hold != 'undefined'){
						if(v.qty_hold.length != 0){
							async.forEachOf(v.qty_hold,function(vq,kq,eq){
								order_id_hold[m] = vq.order_id;
								m++
							})
						}
					}
				})
				var order_idarr = _.union(order_id_sold,order_id_hold)
				
				order_coll.find({order_id:{$in:order_idarr}}).toArray(function(err,r){
					if(err){
						debug.log('error line 171 admin')
						debug.log(err)
						cb(null,false,[],[])
					}else{
						cb(null,true,rows_ticket,r)
					}
				})
			}else{
				cb(null,false,[],[])
			}
		},
		function sync_data(stat,rows_ticket,rows_order,cb){
			if(stat == true){
				var groupby_event = _.groupBy(rows_ticket,function(d){
					return d['event_id']
				})
				
				var fin = [];
				var n = 0;
				async.forEachOf(groupby_event,function(v,k,e){
					fin[n] = new Object();
					fin[n].event_id = k;
					
					var tickets = 0;
					var tickets_stock = 0;
					var table = 0;
					var table_stock = 0;
					var gross_sale = 0;
					var gross_sale_tickets = 0;
					var gross_sale_tables = 0;
					async.forEachOf(v,function(ve,ke,ee){
						if(ve.ticket_type == 'purchase'){
							
							var num_tickets_qty_hold = 0;
							if(typeof ve.qty_hold != 'undefined'){
								async.forEachOf(ve.qty_hold,function(vt,kt,et){
									
									async.forEachOf(rows_order,function(vo,ko,eo){
										if(vo.order_id == vt.order_id){
											if(typeof vo.vt_response != 'undefined'){
												gross_sale_tickets += parseInt(vo.vt_response.gross_amount)
											}
										}
									})
									
									num_tickets_qty_hold += parseInt(vt.qty)
								})
							}
							
							var num_tickets_sold = 0
							if(typeof ve.sold != 'undefined'){
								async.forEachOf(ve.sold,function(vs,ks,es){
									
									async.forEachOf(rows_order,function(vo,ko,eo){
										if(vo.order_id == vs.order_id){
											if(typeof vo.vt_response != 'undefined'){
												gross_sale_tickets += parseInt(vo.vt_response.gross_amount)
											}
										}
									})
									
									num_tickets_sold += parseInt(vs.num_buy)
								})
							}
							
							tickets += parseInt(num_tickets_sold)
							tickets_stock += (parseInt(ve.quantity)+parseInt(num_tickets_qty_hold)+parseInt(num_tickets_sold))
						}
						if(ve.ticket_type == 'booking'){
							
							var num_bookings_qty_hold = 0;
							if(typeof ve.qty_hold != 'undefined'){
								async.forEachOf(ve.qty_hold,function(vt,kt,et){
									
									async.forEachOf(rows_order,function(vo,ko,eo){
										if(vo.order_id == vt.order_id){
											if(typeof vo.vt_response != 'undefined'){
												gross_sale_tables += parseInt(vo.vt_response.gross_amount)
											}
										}
									})
									
									num_bookings_qty_hold += parseInt(vt.qty)
								})
							}
							
							var num_bookings_sold = 0
							if(typeof ve.sold != 'undefined'){
								async.forEachOf(ve.sold,function(vs,ks,es){
									
									async.forEachOf(rows_order,function(vo,ko,eo){
										if(vo.order_id == vs.order_id){
											if(typeof vo.vt_response != 'undefined'){
												gross_sale_tables += parseInt(vo.vt_response.gross_amount)
											}
										}
									})
									
									num_bookings_sold += parseInt(vs.num_buy)
								})
							}
							
							table += parseInt(num_bookings_sold)
							table_stock += (parseInt(ve.quantity)+parseInt(num_bookings_qty_hold)+parseInt(num_bookings_sold))
						}
					})
					fin[n].tickets = tickets;
					fin[n].tickets_stock = tickets_stock;
					fin[n].table = table;
					fin[n].table_stock = table_stock;
					fin[n].gross_sale = parseInt(gross_sale_tables) + parseInt(gross_sale_tickets);
					
					n++;
				})
				cb(null,true,fin)
			}else{
				cb(null,false,[])
			}
		}
	],function(err,stat,merge_data){
		if(stat == true){
			res.json(merge_data)
		}else{
			res.json({code_error:403})
		}
	})
}