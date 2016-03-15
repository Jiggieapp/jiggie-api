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
	var card_id = req.body.card_id;
	
	customers_coll.update(
	{
		fb_id:fb_id,
		"cc_info.card_id":card_id
	},{
		$pull:{
			cc_info:{card_id:card_id}
		}
	},function(err,upd){
		if(err){
			res.json({code_error:403})
		}else{
			debug.log(upd);
			if(upd){
				res.json({success:true});
			}else{
				res.json({code_error:403})
			}
			
		}
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
			order_coll.find({fb_id:fb_id}).toArray(function(err,r){
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
							n++;
						}
					})
				})
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
	var cond = {order_id:order_id}
	async.waterfall([
		function get_order(cb){
			order_coll.findOne(cond,function(err,r){
				if(!err && r != null){
					delete r.__v;
					delete r.mail_status;
					cb(null,true,r)
				}else{
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
		function sync_data(stat,rorder,revent,cb){
			if(stat == true){
				if(typeof rorder.vt_response == 'undefined' || rorder.vt_response == null || rorder.vt_response == ''){
					debug.log('data vt null line 171 other commerce')
					cb(null,false,[]);
				}else{
					var type = '';
					if(rorder.vt_response.payment_type == 'bank_transfer'){
						if(rorder.vt_response.transaction_status == 'pending'){
							type = 'va_pending';
						}else if(rorder.vt_response.transaction_status == 'settlement'){
							type = 'va_success';
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
					template_success_screen(req,rorder,revent,type,function(template){
						cb(null,true,template);
					})
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

function template_success_screen(req,rorder,revent,type,next){
	var json_data = new Object();
	json_data.order_id = rorder.order_id;
	json_data.order_number = rorder.code;
	json_data.order_status = rorder.order_status;
	json_data.payment_status = rorder.payment_status;
	json_data.type = type;
	
	if(type == 'va_pending'){
		json_data.payment_timelimit = rorder.payment_timelimit;
		json_data.created_at = rorder.created_at;
		json_data.timelimit = req.app.get('helpers').addHours(new Date(rorder.created_at).getTime(),rorder.payment_timelimit);
		
		json_data.amount = rorder.total_price;
		
		json_data.virtual_number = rorder.vt_response.permata_va_number;
		
		json_data.step_payment = new Object();
		json_data.step_payment.bca = new Object();
		json_data.step_payment.bca.header = 'Cara Pembayaran lewat ATM BCA/Jaringan ATM PRIMA';
		json_data.step_payment.bca.step = [];
		json_data.step_payment.bca.step[0] = '1. Pada Menu utama, Pilih Transaksi Lainnya.';
		json_data.step_payment.bca.step[1] = '2. Pilih Transfer.';
		json_data.step_payment.bca.step[2] = '3. Pilih Ke Rek Bank Lain.';
		json_data.step_payment.bca.step[3] = '4. Masukkan kode 013 untuk Bank Permata lalu tekan Benar.';
		json_data.step_payment.bca.step[4] = '5. Masukkan jumlah tagihan yang akan Anda bayar secara lengkap. Pembayaran dengan jumlah yang tidak sesuai akan otomatis ditolak.';
		json_data.step_payment.bca.step[5] = '6. Masukkan '+rorder.vt_response.permata_va_number+' (16 digit no. virtual account pembayaran) lalu tekan Benar.';
		json_data.step_payment.bca.step[6] = '7. Pada halaman konfirmasi transfer akan muncul jumlah yang dibayarkan & nomor rekening tujuan. Jika informasinya telah sesuai tekan Benar.';
		
		json_data.step_payment.mandiri = new Object();
		json_data.step_payment.mandiri.header = 'Cara Pembayaran lewat ATM Mandiri/Jaringan ATM Bersama :';
		json_data.step_payment.mandiri.step = [];
		json_data.step_payment.mandiri.step[0] = '1. Pada Menu utama, pilih Transaksi Lainnya.';
		json_data.step_payment.mandiri.step[1] = '2. Pilih Transfer.';
		json_data.step_payment.mandiri.step[2] = '3. Pilih Antar Bank Online.';
		json_data.step_payment.mandiri.step[3] = '4. Masukkan nomor 013 '+rorder.vt_response.permata_va_number+' (kode 013 dan 16 digit Virtual account).';
		json_data.step_payment.mandiri.step[4] = '5. Masukkan jumlah tagihan yang akan Anda bayar secara lengkap. Pembayaran dengan jumlah yang tidak sesuai akan otomatis ditolak.';
		json_data.step_payment.mandiri.step[5] = '6. Pada halaman konfirmasi transfer akan muncul jumlah yang dibayarkan & nomor rekening tujuan. Jika informasinya telah sesuai tekan Benar.';
		
		json_data.step_payment.permata = new Object();
		json_data.step_payment.permata.header = 'Cara Pembayaran lewat ATM Bank Permata/ATM Alto :';
		json_data.step_payment.permata.step = [];
		json_data.step_payment.permata.step[0] = '1. Pada Menu Utama, pilih Transaksi Lainnya.';
		json_data.step_payment.permata.step[1] = '2. Pilih Transaksi Pembayaran.';
		json_data.step_payment.permata.step[2] = '3. Pilih Lain-lain.';
		json_data.step_payment.permata.step[3] = '4. Pilih Pembayaran Virtual Account.';
		json_data.step_payment.permata.step[4] = '5. Masukkan 16 digit no. Virtual Account '+rorder.vt_response.permata_va_number;
		json_data.step_payment.permata.step[5] = '6. Di halaman konfirmasi akan muncul no. virtual account dan jumlah tagihan, lalu tekan Benar.';
		json_data.step_payment.permata.step[6] = '7. Pilih rekening pembayaran Anda dan tekan Benar.';
	}else if(type == 'va_success'){
		json_data.event = revent;
		json_data.summary = rorder;
	}else if(type == 'bp_pending'){
		json_data.payment_timelimit = rorder.payment_timelimit;
		json_data.created_at = rorder.created_at;
		json_data.timelimit = req.app.get('helpers').addHours(new Date(rorder.created_at).getTime(),rorder.payment_timelimit);
		
		json_data.amount = rorder.total_price;
		
		json_data.bill_key = rorder.vt_response.bill_key;
		
		json_data.step_payment = new Object();
		json_data.step_payment.atm_mandiri = new Object();
		json_data.step_payment.atm_mandiri.header = 'Pembayaran melalui ATM Mandiri:';
		json_data.step_payment.atm_mandiri.step = [];
		json_data.step_payment.atm_mandiri.step[0] = '1. Masukan PIN anda.';
		json_data.step_payment.atm_mandiri.step[1] = '2. Pada menu utama pilih menu Pembayaran kemudian pilih menu Multi Payment.';
		json_data.step_payment.atm_mandiri.step[2] = '3. Masukan Kode Perusahaan, dalam hal ini adalah 70012 kemudian tekan tombol Benar.';
		json_data.step_payment.atm_mandiri.step[3] = '4. Masukan Kode Pembayaran anda, dalam hal ini adalah '+rorder.vt_response.bill_key+' kemudian anda akan mendapatkan detail pembayaran anda.';
		json_data.step_payment.atm_mandiri.step[4] = '5. Konfirmasi pembayaran anda.';
		
		json_data.step_payment.online_mandiri = new Object();
		json_data.step_payment.online_mandiri.header = 'Cara membayar melalui Internet Banking Mandiri:';
		json_data.step_payment.online_mandiri.step = [];
		json_data.step_payment.online_mandiri.step[0] = '1. Login ke Internet Banking Mandiri (https://ib.bankmandiri.co.id/) (https://ib.bankmandiri.co.id/).';
		json_data.step_payment.online_mandiri.step[1] = '2. Di Menu Utama silakan pilih Bayar kemudian pilih Multi Payment.';
		json_data.step_payment.online_mandiri.step[2] = '3. Pilih akun anda di Dari Rekening, kemudian di Penyedia Jasa pilih Veritrans.';
		json_data.step_payment.online_mandiri.step[3] = '4. Masukkan Kode Pembayaran anda, dalam hal ini adalah '+rorder.vt_response.bill_key+' dan klik Lanjutkan.';
		json_data.step_payment.online_mandiri.step[4] = '5. Konfirmasi pembayaran anda menggunakan Mandiri Token.';
		
	}else if(type == 'bp_success'){
		json_data.event = revent;
		json_data.summary = rorder;
	}else if(type == 'cc'){
		json_data.event = revent;
		json_data.summary = rorder;
	}
	next(json_data);
}