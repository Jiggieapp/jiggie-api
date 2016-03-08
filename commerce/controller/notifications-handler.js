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
	handling_va_paid(req,function(data){
		res.json(data);
	})
};

function handling_va_paid(req,next){
	var job = new cron({
	  cronTime: '*/10 * * * * *',
	  onTick: function() {
		get_status(req,function(dt){
			debug.log(dt);
		})
	  },
	  start: true,
	  timeZone: 'Asia/Jakarta'
	});
	job.start();
	next(true)
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
									debug.log(results);
									if(results.transaction_status == 'settlement'){
										send_mail(req,v,results,function(mail_stat){
											if(mail_stat == true){
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


function send_mail(req,dt,vt,next){
	var host = req.app.get('mail_host');
	var port = req.app.get('mail_port');
	var user = req.app.get('mail_user');
	var pass = req.app.get('mail_pass');
	
	var from = 'cto@jiggieapp.com';
	var to = dt.guest_detail.email;
	var subject = '';
	var html = '';
	
	if(vt.payment_type == 'credit_card'){
		if(vt.transaction_status == 'settlement'){
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
			debug.log(info.response)
			next(true);
		}
	});
}

exports.sendnotif = function(req,res){
	var post = req.body;
	var dt_order = post.dt_order;
	var vt = post.vt;
	
	send_mail(req,dt,vt,function(mail_stat){
		if(mail_stat == true){
			res.json({mail:true})
		}else{
			res.json({mail:false})
		}
	})
}