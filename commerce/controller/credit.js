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
var redis   = require("redis");
var redisclient  = redis.createClient(6379,"jiggieappsredis.futsnq.0001.apse1.cache.amazonaws.com");

var ppt = require('path').join(__dirname,"../../global/invite_url.json");
var pkg = require('fs-sync').readJSON(ppt);
var comurl = pkg.uri
var invite_url = comurl+'/invite/';

exports.invite = function(req,res){
	var post = req.body;
	var name = xssFilters.inHTMLData(post.contact.name);
	var email = post.contact.email;
	var phone = [];
	if(typeof post.contact.phone == 'undefined'){
		phone = []
	}else{
		phone = post.contact.phone
	}
	
	debug.log2(post)
	
	var fb_id = xssFilters.inHTMLData(post.fb_id);
	var uniq_id = xssFilters.inHTMLData(post.contact.uniq_id);
	
	invite(req,name,email,phone,fb_id,uniq_id,function(dt){
		res.json(dt)
	})
}

exports.invite_all = function(req,res){
	var post = req.body;
	var fb_id = xssFilters.inHTMLData(post.fb_id)
	var arr_contact = post.contact;
	
	debug.log2(post)
	
	async.forEachOf(arr_contact,function(v,k,e){
		invite(req,v.name,v.email,v.phone,fb_id,v.uniq_id,function(dt){
			debug.log(dt)
		})
	})
	res.json({success:true})
}

exports.contact = function(req,res){
	var post = req.body
	var fb_id = xssFilters.inHTMLData(post.fb_id);
	var contact = post.contact;
	var device_type = xssFilters.inHTMLData(post.device_type);
	
	redisclient.get("contact_"+fb_id+"_"+device_type,function(err,val){
		// if(val == null){
			save_listing_contact(req,function(dt){
				res.json(dt)
			})
		// }else{
			// res.json(JSON.parse(val))
		// }
	})
	
}

exports.invite_code = function(req,res){
	var fb_id = xssFilters.inHTMLData(req.params.fb_id);
	
	async.waterfall([
		function get_rewards(cb){
			promo_rules_coll.findOne({_id:new ObjectId('5735a787963c83f84cb1ff06')},function(err,r){
				cb(null,r)
			})
		},
		function get_promocode(rows_rewards,cb){
			ref_promocode_coll.find({}).toArray(function(err,r){
				cb(null,rows_rewards,r)
			})
		},
		function get_cust(rows_rewards,rows_promo,cb){
			customers_coll.findOne({fb_id:fb_id},function(err,r){
				cb(null,rows_rewards,rows_promo,r)
			})
		},
		function sync_data(rows_rewards,rows_promo,rows_cust,cb){
			var rewards_inviter = rows_rewards.credit.amount_inviter
			var rewards_invitee = rows_rewards.credit.amount_invitee
			
			var msg_share = '';
			var msg_invite = '';
			var sms_share = '';
			var fb_share = '';
			
			var call_gender = '';
			if(rows_cust.gender == 'female'){
				call_gender = 'her'
			}else if(rows_cust.gender == 'male'){
				call_gender = 'his'
			}
			
			async.forEachOf(rows_promo,function(v,k,e){
				if(v.type == 'invite_code'){
					msg_invite = v.message.replace('{{rewards_inviter}}',rewards_inviter)
					msg_invite = msg_invite.replace('{{rewards_invitee}}',rewards_invitee)
				}else if(v.type == 'sms_invite'){
					sms_share = v.message.replace('{{inviter_full_name}}',rows_cust.first_name+' '+rows_cust.last_name)
					sms_share = sms_share.replace('{{call_gender}}',call_gender)
					sms_share = sms_share.replace('{{rewards_invitee}}',rewards_invitee)
				}else if(v.type == "msg_share"){
					msg_share = v.message.replace('{{rewards_invitee}}',rewards_invitee)
				}else if(v.type == "fb_share"){
					fb_share = v.message.replace('{{rewards_invitee}}',rewards_invitee)
				}
			})
			
			if(typeof rows_cust.promo_code == 'undefined' || rows_cust.promo_code == '' || rows_cust.promo_code == null){
				var parseCode = String(randomString.alphaNumUpper(4,new Date().getTime()));
				var gencode = String(rows_cust.first_name+parseCode).toUpperCase();
				customers_coll.update({fb_id:fb_id},{
					$push:{
						promo_code:{
							rules_id:"5735a787963c83f84cb1ff06",
							type:'invite',
							inviter_code:gencode,
							invitee_code:''
						}
					}
				},function(err,upd){
					if(!err){
						save_to_rules(rows_rewards,fb_id,gencode)
						
						sms_share = sms_share.replace('{{invite_url}}',invite_url+gencode)
						msg_share = msg_share.replace('{{invite_url}}',invite_url+gencode)
						fb_share = fb_share.replace('{{invite_url}}',invite_url+gencode)
						cb({
							code:gencode,
							msg_invite:msg_invite,
							sms_share:sms_share,
							msg_share:msg_share,
							fb_share:fb_share,
							invite_url:invite_url+gencode,
							rewards_inviter:rewards_inviter
						})
					}
				})
			}else{
				var ck_exist = false
				async.forEachOf(rows_cust.promo_code,function(v,k,e){
					if(v.type == "invite"){
						ck_exist = true
					}
				})
				
				if(ck_exist == true){
					var gencode = '';
					async.forEachOf(rows_cust.promo_code,function(v,k,e){
						if(v.type == 'invite'){
							gencode = v.inviter_code
						}
					})
					save_to_rules(rows_rewards,fb_id,gencode)
					
					sms_share = sms_share.replace('{{invite_url}}',invite_url+gencode)
					msg_share = msg_share.replace('{{invite_url}}',invite_url+gencode)
					fb_share = fb_share.replace('{{invite_url}}',invite_url+gencode)
					cb({
						code:gencode,
						msg_invite:msg_invite,
						sms_share:sms_share,
						msg_share:msg_share,
						fb_share:fb_share,
						invite_url:invite_url+gencode,
						rewards_inviter:rewards_inviter
					})
				}else{
					var parseCode = String(randomString.alphaNumUpper(4,new Date().getTime()));
					var gencode = String(rows_cust.first_name+parseCode).toUpperCase();
					customers_coll.update({fb_id:fb_id},{
						$push:{
							promo_code:{
								rules_id:"5735a787963c83f84cb1ff06",
								type:'invite',
								inviter_code:gencode,
								invitee_code:''
							}
						}
					},function(err,upd){
						if(!err){
							save_to_rules(rows_rewards,fb_id,gencode)
							
							sms_share = sms_share.replace('{{invite_url}}',invite_url+gencode)
							msg_share = msg_share.replace('{{invite_url}}',invite_url+gencode)
							fb_share = fb_share.replace('{{invite_url}}',invite_url+gencode)
							cb({
								code:gencode,
								msg_invite:msg_invite,
								sms_share:sms_share,
								msg_share:msg_share,
								fb_share:fb_share,
								invite_url:invite_url+gencode,
								rewards_inviter:rewards_inviter
							})
						}
					})
				}
			}
		}
	],function(dt){
		res.json(dt)
	})
	
}

exports.redeem_code = function(req,res){
	redeem_code(req,function(dt){
		res.json(dt);
	})
}

exports.balance_credit = function(req,res){
	balance_credit(req,function(dt){
		res.json(dt)
	})
}

function balance_credit(req,next){
	var fb_id = xssFilters.inHTMLData(req.params.fb_id);
	
	async.waterfall([
		function get_cust(cb){
			customers_coll.findOne({fb_id:fb_id},function(err,r){
				if(err){
					debug.log(err);
					debug.log('error line 202 credit commerce');
					cb(null,false,[],{code_error:403})
				}else if(r == null){
					cb(null,false,[],{code_error:204})
				}else{
					cb(null,true,r,{})
				}
			})
		},
		function get_rules(stat,rows_cust,code,cb){
			if(stat == true){
				if(typeof rows_cust.promo_code != "undefined" && rows_cust.promo_code.length > 0){
					var rules_id_arr = []
					var n = 0
					async.forEachOf(rows_cust.promo_code,function(v,k,e){
						if(v.invitee_code != ""){
							if(new Date() < v.end_date){
								if(typeof v.used == "undefined" || v.used == false){
									rules_id_arr[n] = new ObjectId(v.rules_id);
									n++;
								}
							}
						}
					})
					
					var cond = {_id:{$in:rules_id_arr}}
					promo_rules_coll.find(cond).toArray(function(err,r){
						if(err){
							debug.logdis(err);
							debug.logdis("error line 231 credit commerce");
							cb(null,false,false,[],[],{code_error:403})
						}else if(r.length == 0){
							debug.logdis("no data rules for grab in credit commercd");
							cb(null,true,true,rows_cust,[],{})
						}else{
							cb(null,true,true,rows_cust,r,{})
						}
					})
				}else{
					cb(null,true,false,[],[],{})
				}
			}else{
				cb(null,false,false,[],[],code)
			}
		},
		function sync_data(stat,is_promo_exist,rows_cust,rows_rules,code,cb){
			if(stat == true){
				if(is_promo_exist == true){
					var json_data = new Object();
					var tot_credit_active = 0
					
					var credit_data = [];
					var n = 0
					
					rows_rules = _.where(rows_rules,{promo_type:"credit"})
					
					async.forEachOf(rows_cust.promo_code,function(v,k,e){
						if(v.invitee_code != ""){
							credit_data[n] = new Object();
							if(typeof v.used == "undefined" || v.used != true){
								if(new Date() < v.end_date){
									async.forEachOf(rows_rules,function(vrul,krul,erul){
										if(String(vrul._id) == String(v.rules_id)){
											credit_data[n].tot_credit_active = vrul.credit.amount_invitee;
											n++;
										}
									})
								}
							}else if(v.used == true){
								credit_data[n].tot_credit_active = v.used_by.value_left;
								n++;
							}
						}
					})
					
					
					if(credit_data.length > 0){
						async.forEachOf(credit_data,function(v,k,e){
							if(typeof v.tot_credit_active != "undefined"){
								tot_credit_active += parseInt(v.tot_credit_active);
							}
						})
					}
					
					if(String(tot_credit_active) == "NaN"){
						tot_credit_active = "0"
					}
					
					cb(null,true,{tot_credit_active:String(tot_credit_active)},{})
				}else{
					cb(null,true,{tot_credit_active:'0'},{})
				}
			}else{
				cb(null,false,{},code)
			}
		}
	],function(err,stat,json_data,code){
		if(stat == true){
			next(json_data)
		}else{
			next(code)
		}
	})
}

function redeem_code(req,next){
	var post = req.body;
	var redeem_code = xssFilters.inHTMLData(post.code);
	var fb_id = xssFilters.inHTMLData(post.fb_id);
	
	async.waterfall([
		function get_rules(cb){
			var msg = "Can't Redeem Code"
			var cond = {
				has_code:true,
				target_user:{$in:["member"]},
				"code.code":redeem_code,
				// promo_type:'credit',
				is_active:{$ne:false},
				is_deleted:{$ne:true}
			}
			promo_rules_coll.findOne(cond,function(err,r){
				if(err){
					debug.log2(err);
					debug.log2('error line 172 credit comerce');
					cb(null,false,[],msg,{code_error:403})
				}else if(r == null){
					debug.log2('error line 175 credit comerce');
					cb(null,false,[],msg,{code_error:204})
				}else{
					cb(null,true,r,msg,{})
				}
			})
		},
		function get_customers(stat,rows_rules,msg,code,cb){
			if(stat == true){
				customers_coll.findOne({fb_id:fb_id},function(err,r){
					if(err){
						debug.log2(err);
						debug.log2('error line 189 credit commerce');
						cb(null,false,[],[],msg,{code_error:403})
					}else if(r == null){
						debug.log2('error line 192 credit commerce');
						cb(null,false,[],[],msg,{code_error:204})
					}else{
						cb(null,true,rows_rules,r,msg,{})
					}
				})
			}else{
				cb(null,false,[],[],msg,code)
			}
		},
		function check_data(stat,rows_rules,rows_cust,msg,code,cb){
			if(stat == true){
				var skng = new Date();
				var check_cust = true;
				var check_code = true;
				
				
				if(typeof rows_cust.promo_code == 'undefined' || rows_cust.promo_code.length == 0){
					check_cust = true;
				}else{
					async.forEachOf(rows_cust.promo_code,function(v,k,e){
						if(String(v.rules_id) == String(rows_rules._id)){
							debug.log2('Promo Already Used');
							msg = "Promo Already Used"
							check_cust = false
							// if(v.inviter_code == redeem_code){
								// debug.log2('redeem code used by the owner');
								// check_cust = false
							// }else if(v.invitee_code == redeem_code){
								// debug.log2('redeem code already used');
								// check_cust = false
							// }
						}
					})
				}
				
				if(check_cust == true){
					if(rows_rules.code.length > 0){
						async.forEachOf(rows_rules.code,function(v,k,e){
							if(v.code == redeem_code){
								if(v.start_date <= skng && v.end_date >= skng){
									if(v.is_multiple == true){
										check_code = true
									}else if(v.is_multiple == false){
										if(typeof v.used_at == "undefined"){
											check_code = true
										}else{
											if(v.used_at.length == 0){
												check_code = true
											}else{
												debug.log2('redeem code multiple val FALSE');
												msg = "redeem code multiple val FALSE"
												check_code = false
											}
										}
									}	
								}else{
									debug.log2('redeem code ACTIVATION ALREADY EXPIRED');
									msg = "redeem code ACTIVATION ALREADY EXPIRED"
									check_code = false
								}
							}
						})
					}
					var check_all = false;
					if(check_cust == true && check_code == true){
						check_all = true
					}else{
						check_all = false
					}
					cb(null,true,rows_rules,rows_cust,check_all,msg,{})
				}else{
					cb(null,true,rows_rules,rows_cust,false,msg,{})
				}
			}else{
				cb(null,false,[],[],false,msg,code)
			}
		},
		function updating(stat,rows_rules,rows_cust,check_all,msg,code,cb){
			if(stat == true){
				if(check_all == true){
					var cond_promo = {
						_id:new ObjectId(rows_rules._id),
						"code.code":redeem_code
					}
					var upd_form_promo = {
						$push:{
							"code.$.used_at":{
								fb_id:fb_id,
								created_at:new Date()
							}
						}
					}
					promo_rules_coll.update(cond_promo,upd_form_promo,function(err,upd_promo){
						if(err){
							debug.log2(err)
						}else{
							var cond_cust = {fb_id:fb_id}
							var form_upd_cust = {
								$push:{
									promo_code:{
										type:"promo",
										rules_id:rows_rules._id,
										inviter_code:"",
										invitee_code:redeem_code,
										start_date:new Date(),
										end_date:req.app.get("helpers").intervalDateFilter(rows_rules.credit.expiry_credit)
									}
								}
							}
							customers_coll.update(cond_cust,form_upd_cust,function(err,upd_cust){
								if(err){
									debug.log2(err)
								}else{
									cb(null,true,rows_rules,rows_cust,true,msg,{})
								}
							})
						}
					})
				}else{
					cb(null,true,rows_rules,rows_cust,check_all,msg,{})
				}
			}else{
				cb(null,false,[],[],check_all,msg,code)
			}
		},
		function updating_credit(stat,rows_rules,rows_cust,check_all,msg,code,cb){
			if(stat == true){
				if(rows_rules.promo_type == 'credit'){
					var from_fb_id = '';
					async.forEachOf(rows_rules.code,function(v,k,e){
						if(v.code == redeem_code){
							from_fb_id = v.used_by
						}
					})
					
					var cond = {
						fb_id:fb_id
					}
					credit_points_coll.findOne({fb_id:fb_id},function(err,r){
						if(r == null){
							var form_ins = {
								fb_id:fb_id,
								totcredit_appinvite:parseInt(rows_rules.credit.amount_invitee),
								activity:[{
									rewards:parseInt(rows_rules.credit.amount_invitee),
									type:'promo',
									plot:'credit',
									flow:'get_from_promo',
									logs:{},
									from_fb_id:from_fb_id,
									updated_at:new Date(),
									rules_id:String(rows_rules._id)
								}],
								created_at:new Date()
							}
							credit_points_coll.insert(form_ins,function(err,ins){
								if(!err){
									cb(null,true,rows_rules,rows_cust,check_all,msg,{})
								}else{
									debug.log2(err)
								}
							})
						}else{
							var totcredit_appinvite = parseInt(r.totcredit_appinvite)+parseInt(rows_rules.credit.amount_invitee)
							var cond2 = {
								fb_id:fb_id
							}
							var form_upd2 = {
								$set:{
									totcredit_appinvite:totcredit_appinvite
								},
								$push:{
									activity:{
										rewards:parseInt(rows_rules.credit.amount_invitee),
										type:'promo',
										plot:'credit',
										flow:'get_from_promo',
										logs:{},
										from_fb_id:from_fb_id,
										updated_at:new Date(),
										rules_id:String(rows_rules._id)
									}
								}
							}
							credit_points_coll.update(cond2,form_upd2,function(err,upd){
								if(!err){
									cb(null,true,rows_rules,rows_cust,check_all,msg,{})
								}else{
									debug.log2(err)
								}
							})
						}
					})
				}else{
					cb(null,true,rows_rules,rows_cust,check_all,msg,{})
				}
				
			}else{
				cb(null,false,[],[],check_all,msg,code)
			}
		},
		function sync_data(stat,rows_rules,rows_cust,check_all,msg,code,cb){
			if(stat == true){
				if(check_all == true){
					msg = rows_rules.message
					msg = msg.replace('{{invitee_full_name}}',String(rows_cust.first_name+" "+rows_cust.last_name))
					msg = msg.replace('{{rewards}}',parseInt(rows_rules.credit.amount_invitee))
					cb(null,true,{msg:msg,is_check:true},{})
				}else if(check_all == false){
					cb(null,true,{msg:msg,is_check:false},{})
				}
			}else{
				cb(null,false,{msg:msg,is_check:false},code)
			}
		}
	],function(err,stat,sync_data,code){
		if(stat == true){
			next(sync_data);
		}else{
			next(sync_data);
		}
	})
}

function save_listing_contact(req,next){
	var post = req.body
	var fb_id = xssFilters.inHTMLData(post.fb_id);
	var contact = post.contact;
	var device_type = xssFilters.inHTMLData(post.device_type);
	
	async.waterfall([
		function save_phonebook(cb){
			var loop = 0;
			if(typeof contact != "undefined"){
				async.forEachOf(contact,function(v,k,e){
					var record_id='';if(typeof v.record_id != 'undefined'){record_id=v.record_id}
					var name='';if(typeof v.name != 'undefined'){name=v.name}
					var email=[''];if(typeof v.email != 'undefined'){email=v.email}
					var phone=[''];if(typeof v.phone != 'undefined'){phone=v.phone}
					var cond = {
						fb_id:fb_id,
						"contact.record_id":record_id,
						device_type:device_type
					}
					phonebook_coll.findOne(cond,function(err,r){
						if(r == null){
							var uniq_id = String(randomString.alphaNumUpper(12,new Date().getTime()));
							var form_ins = {
								fb_id:fb_id,
								device_type:device_type,
								uniq_id:uniq_id,
								contact:{
									record_id:record_id,
									name:name,
									email:email,
									phone:phone,
									is_active:true
								},
								created_at:new Date(),
								
							}
							phonebook_coll.insert(form_ins,function(err,ins){
								if(!err){
									loop++;
									if(loop == (contact.length)){
										cb(null,true)
									}
								}
							})						
						}else{
							loop++;
							if(loop == (contact.length)){
								cb(null,true)
							}
						}
					})
				})
			}else{
				cb(null,true)
			}
		},
		function get_rules(stat,cb){
			if(stat == true){
				promo_rules_coll.findOne({_id:new ObjectId('5735a787963c83f84cb1ff06')},function(err,r){
					if(err){
						debug.log(err);
						debug.log('error line 22 credits')
						cb(null,false,[])
					}else if(r == null){
						debug.log('error line 25 credits')
						cb(null,false,[])
					}else{
						cb(null,true,r)
					}
				})
			}else{
				cb(null,false,[])
			}
		},
		function get_promocode(stat,rows_rules,cb){
			ref_promocode_coll.find({}).toArray(function(err,r){
				cb(null,true,rows_rules,r)
			})
		},
		function get_cust(stat,rows_rules,rows_promo,cb){
			customers_coll.findOne({fb_id:String(fb_id)},function(err,r){
				cb(null,true,rows_rules,rows_promo,r)
			})
		},
		function listing(stat,rows_rules,rows_promo,rows_cust,cb){
			if(stat == true){
				phonebook_coll.find({fb_id:fb_id,device_type:device_type}).toArray(function(err,r){
					if(err){
						debug.log(err);
						debug.log('error line 3232 credit');
						cb(null,false,[],{code_error:403})
					}/*else if(r.length <= 0){
						debug.log('error line 52231 credit');
						cb(null,false,[],{code_error:204})
					}*/else{
						var dt = new Object();
						dt.contact = [];
						var n = 0;
						if(r.length > 0){
							async.forEachOf(r,function(v,k,e){
								dt.contact[n] = new Object();
								dt.contact[n] = v.contact;
								dt.contact[n].uniq_id = v.uniq_id;
								dt.contact[n].credit = rows_rules.credit.amount_inviter;
								n++;
							})
							dt.contact = _.sortBy(dt.contact,"name")
						}
						var tot_credit = 0
						// async.forEachOf(dt.contact,function(v,k,e){
							// tot_credit += v.credit
						// })
						dt.tot_credit = tot_credit
						
						var rewards_inviter = rows_rules.credit.amount_inviter
						var rewards_invitee = rows_rules.credit.amount_invitee
						dt.rewards_inviter = rewards_inviter
						
						var msg_share = '';
						var msg_invite = '';
						
						var call_gender = '';
						if(typeof rows_cust.gender != 'undefined'){
							if(rows_cust.gender == 'female'){
								call_gender = 'her'
							}else if(rows_cust.gender == 'male'){
								call_gender = 'his'
							}
						}else{
							call_gender = 'his'
						}
						
						async.forEachOf(rows_promo,function(v,k,e){
							if(v.type == 'invite_code'){
								msg_invite = v.message.replace('{{rewards_inviter}}',rewards_inviter)
								msg_invite = msg_invite.replace('{{rewards_invitee}}',rewards_invitee)
							}
							if(v.type == 'invite_code_share'){
								msg_share = v.message.replace('{{inviter_full_name}}',rows_cust.first_name+' '+rows_cust.last_name)
								msg_share = msg_share.replace('{{call_gender}}',call_gender)
							}
						})
						var gencode = '';
						async.forEachOf(rows_cust.promo_code,function(v,k,e){
							if(v.type == 'invite'){
								gencode = v.inviter_code
							}
						})
						
						var msg_share = '';
						var msg_invite = '';
						var sms_share = '';
						var fb_share = '';
						
						var call_gender = '';
						if(rows_cust.gender == 'female'){
							call_gender = 'her'
						}else if(rows_cust.gender == 'male'){
							call_gender = 'his'
						}
						
						async.forEachOf(rows_promo,function(v,k,e){
							if(v.type == 'invite_code'){
								msg_invite = v.message.replace('{{rewards_inviter}}',rewards_inviter)
								msg_invite = msg_invite.replace('{{rewards_invitee}}',rewards_invitee)
							}else if(v.type == 'sms_invite'){
								sms_share = v.message.replace('{{inviter_full_name}}',rows_cust.first_name+' '+rows_cust.last_name)
								sms_share = sms_share.replace('{{call_gender}}',call_gender)
								sms_share = sms_share.replace('{{rewards_invitee}}',rewards_invitee)
							}else if(v.type == "msg_share"){
								msg_share = v.message.replace('{{rewards_invitee}}',rewards_invitee)
							}else if(v.type == "fb_share"){
								fb_share = v.message.replace('{{rewards_invitee}}',rewards_invitee)
							}
						})
						msg_share = msg_share.replace('{{invite_url}}',invite_url+gencode)
						sms_share = sms_share.replace('{{invite_url}}',invite_url+gencode)
						msg_invite = msg_invite.replace('{{invite_url}}',invite_url+gencode)
						fb_share = fb_share.replace('{{invite_url}}',invite_url+gencode)
						dt.msg_share = msg_share
						dt.sms_share = sms_share
						dt.msg_invite = msg_invite
						dt.fb_share = fb_share
						
						cb(null,true,dt,{})
							
					}
				})
			}
		}
	],function(err,stat,dt,code){
		if(stat == true){
			next(dt)
		}else{
			next(code)
		}
	})
}

function invite(req,name,email,phone,fb_id,uniq_id,next){
	async.waterfall([
		function cek_active(cb){
			ref_promocode_coll.findOne({type:'invite'},function(err,r){
				if(r.is_active == true){
					cb(null,true,{});
				}else{
					cb(null,false,{code_error:403})
				}
			})
		},
		function get_rewards(stat,code,cb){
			if(stat == true){
				promo_rules_coll.findOne({_id:new ObjectId('5735a787963c83f84cb1ff06')},function(err,r){
					if(err){
						debug.log(err);
						debug.log('error line 22 credits')
						cb(null,false,[],{code_error:403})
					}else if(r == null){
						debug.log('error line 25 credits')
						cb(null,false,[],{code_error:204})
					}else{
						cb(null,true,r,{})
					}
				})
			}else{
				cb(null,false,[],code)
			}
		},
		function get_cust(stat,rows_rewards,code,cb){
			if(stat == true){
				customers_coll.findOne({fb_id:fb_id},function(err,r){
					if(err){
						debug.log(err);
						debug.log('error line 38 credits')
						cb(null,false,[],[],{code_error:403})
					}else if(r == null){
						debug.log('error line 41 credits')
						cb(null,false,[],[],{code_error:204})
					}else{
						cb(null,true,rows_rewards,r,{})
					}
				})
			}else{
				cb(null,false,[],[],code)
			}
		},
		function gen_code(stat,rows_rewards,rows_cust,code,cb){
			if(stat == true){
				var parseCode = String(randomString.alphaNumUpper(4,new Date().getTime()));
				customers_coll.findOne({fb_id:fb_id},function(err,r){
					if(r == null){
						debug.log('error line 59 no DATA credit');
						cb(null,false,[],[],[],code)
					}else{
						if(typeof r.promo_code == 'undefined' || r.promo_code == '' || r.promo_code == null){
							var gencode = String(rows_cust.first_name+parseCode).toUpperCase();
							customers_coll.update({fb_id:fb_id},{
								$push:{
									promo_code:{
										type:'invite',
										rules_id:'5735a787963c83f84cb1ff06',
										inviter_code:gencode,
										invitee_code:'',
										start_date:new Date(),
										end_date:req.app.get("helpers").intervalDateFilter(rows_rewards.credit.expiry_credit)
									}
								}
							},function(err,upd){
								if(!err){
									var cond2 = {_id:new ObjectId('5735a787963c83f84cb1ff06')}
									var form_upd2 = {
										$push:{
											code:{
												code:gencode,
												is_multiple:true,
												start_date:new Date(),
												end_date:req.app.get("helpers").intervalDateFilter(rows_rewards.credit.expiry_credit),
												created_at:new Date(),
												used_at:[],
												used_by:fb_id
											}
										}
									}
									promo_rules_coll.update(cond2,form_upd2,function(err,upd_rules){
										if(err){
											debug.log(err);
										}else{
											cb(null,true,rows_rewards,rows_cust,gencode,{})
										}
									})
								}
							})
						}else{
							var ck_exist = false;
							async.forEachOf(r.promo_code,function(v,k,e){
								if(v.type == "invite"){
									ck_exist = true
								}
							})
							
							if(ck_exist == true){
								var gencode = '';
								async.forEachOf(r.promo_code,function(v,k,e){
									if(v.type == 'invite'){
										gencode = v.inviter_code
									}
								})
								
								cb(null,true,rows_rewards,rows_cust,gencode,{})
							}else{
								var gencode = String(rows_cust.first_name+parseCode).toUpperCase();
								customers_coll.update({fb_id:fb_id},{
									$push:{
										promo_code:{
											type:'invite',
											rules_id:'5735a787963c83f84cb1ff06',
											inviter_code:gencode,
											invitee_code:'',
											start_date:new Date(),
											end_date:req.app.get("helpers").intervalDateFilter(rows_rewards.credit.expiry_credit)
										}
									}
								},function(err,upd){
									if(!err){
										var cond2 = {_id:new ObjectId('5735a787963c83f84cb1ff06')}
										var form_upd2 = {
											$push:{
												code:{
													code:gencode,
													is_multiple:true,
													start_date:new Date(),
													end_date:req.app.get("helpers").intervalDateFilter(rows_rewards.credit.expiry_credit),
													created_at:new Date(),
													used_at:[],
													used_by:fb_id
												}
											}
										}
										promo_rules_coll.update(cond2,form_upd2,function(err,upd_rules){
											if(err){
												debug.log(err);
											}else{
												cb(null,true,rows_rewards,rows_cust,gencode,{})
											}
										})
									}
								})
							}
							
							
						}
					}
				})
				
			}else{
				cb(null,false,[],[],[],code)
			}
		},
		function sync_credit_points(stat,rows_rewards,rows_cust,gencode,code,cb){
			if(stat == true){
				if(rows_rewards.promo_type == 'credit'){
					var inviter_rewards = parseInt(rows_rewards.credit.amount_inviter)
					var invitee_rewards = parseInt(rows_rewards.credit.amount_invitee)
					
					credit_points_coll.findOne({fb_id:fb_id},function(err,r){
						var logs = {
							name:name,
							email:email,
							phone:phone
						}
						if(r == null){
							var form_ins = {
								fb_id:fb_id,
								totcredit_appinvite:0,
								activity:[
									{
										rewards:invitee_rewards,
										type:'appinvite',
										plot:'credit',
										flow:'invite',
										logs:logs,
										rules_id:'5735a787963c83f84cb1ff06',
										updated_at:new Date()
									}
								],
								created_at:new Date()
							}
							credit_points_coll.insert(form_ins,function(err,ins){
								if(err){debug.log(err)}else{
									cb(null,true,rows_rewards,rows_cust,gencode,{})
								}
							})
						}else{
							var cond = {fb_id:fb_id}
							var form_upd = {
								$push:{
									activity:{
										rewards:invitee_rewards,
										type:'appinvite',
										plot:'credit',
										flow:'invite',
										logs:logs,
										rules_id:'5735a787963c83f84cb1ff06',
										updated_at:new Date()
									}
								}
							}
							credit_points_coll.update(cond,form_upd,function(err,upd){
								if(err){debug.log(err)}else{
									cb(null,true,rows_rewards,rows_cust,gencode,{})
								}
							})
						}
					})
				}else if(rows_rewards.promo_type == 'discount'){
					debug.log('NOT CREDIT')
				}
				
				
			}else{
				cb(null,false,[],[],[],code)
			}
		},
		function sync_data(stat,rows_rewards,rows_cust,gencode,code,cb){
			if(stat == true){
				var invitee_name = name;
				var invitee_rewards = "";
				var inviter_name = rows_cust.first_name+' '+rows_cust.last_name;
				var link_promo = invite_url+gencode+"/"+uniq_id;
				
				async.forEachOf(rows_rewards,function(v,k,e){
					if(v.type == "appinvite" && v.models == "invitee" && v.plot == "credit"){
						invitee_rewards = 'Rp. '+String(numeral(v.rewards).format('0,0'))
					}
				})
				
				var photos = '';
				if(typeof rows_cust.photos == 'undefined' || rows_cust.photos.length <= 0){
					photos = '//graph.facebook.com/'+rows_cust.fb_id+'/picture?type=large'
				}else{
					photos = rows_cust.photos[0]
				}
				
				var parseTo = {
					invitee_name:invitee_name,
					invitee_rewards:invitee_rewards,
					inviter_name:inviter_name,
					link_promo:link_promo,
					photos:photos
				}
				
				if(typeof email != "undefined"){
					if(email.length > 0){
						async.forEachOf(email,function(v,k,e){
							send_mail(req,parseTo,v,function(dt){})
						})
					}
				}
				
				cb(null,true,rows_rewards,rows_cust,gencode,{})
				
			}else{
				cb(null,false,[],[],[],code)
			}
		},
		function send_sms(stat,rows_rewards,rows_cust,gencode,code,cb){
			if(stat == true){
				ref_promocode_coll.findOne({type:'sms_invite'},function(err,r){
					if(err){
						debug.log(err)
						debug.log('error line 224 credit commerce')
						cb(null,false,{code_error:403})
					}else if(r == null){
						debug.log('error line 228 credit commerce NO DATA')
						cb(null,false,{code_error:204})
					}else{
						if(typeof phone != "undefined"){
							if(phone.length > 0){
								var inviter_rewards = parseInt(rows_rewards.credit.amount_inviter)
								var invitee_rewards = parseInt(rows_rewards.credit.amount_invitee)
								
								var invitee_full_name = '';
								if(name.indexOf(' ') == -1){
									invitee_full_name = capitalizeFirstLetter(name)
								}else{
									var ex = name.split(' ');
									if(ex[1] == ''){
										invitee_full_name = capitalizeFirstLetter(ex[0])
									}else{
										invitee_full_name = capitalizeFirstLetter(ex[0])+' '+capitalizeFirstLetter(ex[1])
									}
									
								}
								
								var inviter_full_name = capitalizeFirstLetter(rows_cust.first_name)/*+' '+capitalizeFirstLetter(rows_cust.last_name)*/
								
								var call_gender = '';
								if(rows_cust.gender == 'male'){
									call_gender = 'his'
								}else if(rows_cust.gender == 'female'){
									call_gender = 'her'
								}
								
								var link_promo = invite_url+gencode+"/"+uniq_id;
								
								var msg = r.message;
								msg = msg.replace("{{invitee_full_name}}",invitee_full_name)
								msg = msg.replace("{{inviter_full_name}}",inviter_full_name)
								msg = msg.replace("{{call_gender}}",call_gender)
								msg = msg.replace("{{invite_url}}",link_promo)
								msg = msg.replace("{{rewards_invitee}}",invitee_rewards)
								
								var fil_phone = filters_phone(phone);
								async.forEachOf(fil_phone,function(vv,kk,ee){
									sendSMSConfirm(vv,msg,function(){})
								})
								
								cb(null,true,{})
							}else{
								cb(null,true,{})
							}
						}else{
							cb(null,true,{})
						}
					}
				})
			}else{
				cb(null,false,code)
			}
		}
	],function(err,stat,code){
		if(stat == true){
			next({mail_send:true})
		}else{
			next(code)
		}
	})
}

function filters_phone(phone){
	var filter_phone = [];
	var n = 0;
	async.forEachOf(phone,function(v,k,e){
		if(v.indexOf("+") == 0){
			filter_phone[n] = v;
			n++;
		}else if(v.indexOf("0") == 0){
			filter_phone[n] = "+62"+v.substring(1);
			n++;
		}else{
			debug.log(v)
		}
	})
	return filter_phone
}

function sendSMSConfirm(phone,msg,callback){
	var accountSid = 'AC2e411537efa8bd75d3f4bd72624cf7ff'; 
	var authToken = '2ef11198d624fab5b23f009d53a3035a'; 
	 
	var client = require('twilio')(accountSid, authToken);
	client.messages.create({
		to:'+' + phone,
		from: '+12248032473', 
		body: msg
	}, function(err, message) {
		if(err){
			debug.log(err);
		}else{
			debug.log(message);
		}
		callback();
	});
}

function send_mail(req,parseTo,email_to,next){
	var host = req.app.get('mail_host');
	var port = req.app.get('mail_port');
	var user = req.app.get('mail_user');
	var pass = req.app.get('mail_pass');
	
	var path = require('path')
	var templateDir = path.resolve(__dirname,'../../commerce','views','templates');
	
	var from = parseTo.inviter_name+' <invitation@jiggiemail.com>';
	var to = email_to;
	var subject = 'Jiggie Invitation';
	var html = '';
	
	var template = new EmailTemplate(path.join(templateDir,'invite','send'))
	template.render(parseTo,function(err,results){
		if(err){
			debug.log('error line 42 sent email invite credits');
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
					debug.log('error sending mail invite')
				}else{
					debug.log2('EMAIL SENT TO '+email_to+' '+info.response)
				}
			});
		}
	});
	next({mail_send:true})
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function save_to_rules(rows_rules,fb_id,gencode){
	/*start: save code to rules */
	var is_updx = true;
	async.forEachOf(rows_rules.code,function(v,k,e){
		if(v.code == gencode){
			is_updx = false
		}
	})
	if(is_updx == true){
		var condx = {_id:new ObjectId("5735a787963c83f84cb1ff06")}
		var form_updx = {
			$push:{
				code:{
					code:gencode,
					is_multiple:true,
					start_date:new Date(),
					end_date:new Date(),
					used_by:fb_id,
					is_deleted:false,
					is_active:true
				}
			}
		}
		promo_rules_coll.update(condx,form_updx,function(err,upd){if(err){debug.logdis(err)}})
	}
	/*end: save code to rules */
	
	return true;
}
