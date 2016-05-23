var mongo = require('./../models/mongo');
var debug = require('./../config/debug');
var async = require('async');
var eventEmitter = mongo.eventEmitter;
var ObjectId = require('mongodb').ObjectID;
var randomString = require('random-strings');
var numeral = require('numeral')

eventEmitter.on('database_connected',function(){
	mongo.getCollection('customers',function(collection)
	{
		customers_coll = collection;
		console.log("customers connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('membersettings',function(collection)
	{
		membersettings_coll = collection;
		console.log("membersettings connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('ref_tags',function(collection)
	{
		tags_coll = collection;
		console.log("ref_tags connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('city',function(collection)
	{
		city_coll = collection;
		console.log("city connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('credit_points',function(collection)
	{
		credit_points_coll = collection;
		console.log("credit_points connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('ref_phonebook',function(collection)
	{
		phonebook_coll = collection;
		console.log("ref_phonebook connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('ref_rewardcreditsystem',function(collection)
	{
		ref_rewardcreditsystem_coll = collection;
		console.log("ref_rewardcreditsystem connected");
	});
});

eventEmitter.on('database_connected',function(){
	mongo.getCollection('promo_rules',function(collection){
		promo_rules_coll = collection;
		console.log("promo_rules connected");
	});
});

exports.post_fb = function(req, res){
	var post = req.body;
	
	var json = JSON.parse(post.data)
	var invite_code = post.invite_code;
	var uniq_id = post.uniq_id;
	
	if(invite_code == ''){
		res.json({response:0,msg:'Invite Code Empty'})
	}else{
		customers_coll.findOne({fb_id:json.id},function(err,r){
			if(err){
				debug.log(err)
				res.json({code_error:403})
			}else{
				if(typeof uniq_id != 'undefined'){
					var cond = {
						uniq_id : uniq_id
					}
					var form_upd = {
						$set:{
							"contact.is_active":false
						}
					}
					phonebook_coll.update(cond,form_upd,function(err,upd){})
				}
				
				if(r == null){
					// put all data
					sync_post_fb(req,function(dt){
						res.json({response:1,body:dt})
					})
				}else{
					// already as member
					var photos = '';
					if(typeof r.photos != 'undefined' && r.photos.length > 0){
						photos = r.photos[0]
					}else{
						photos = "http://graph.facebook.com/"+fb_id+"/picture?type=large"
					}
					res.json({response:0,photos:photos})
				}
			}
		})
	}
};

function sync_post_fb(req,next){
	var post = req.body;
	var json = JSON.parse(post.data)
	var invite_code = post.invite_code;
	var uniq_id = post.uniq_id;
	
	var parseCode = String(randomString.alphaNumUpper(4,new Date().getTime()));
	var gencode = String(json.first_name+parseCode).toUpperCase();
	var inviter_code = gencode
	
	customers_coll.findOne({"promo_code.inviter_code":invite_code},function(err,r){
		if(err || r == null){
			debug.log("cust inviter not exist")
		}else{
			var use_rulesid = "";
			async.forEachOf(r.promo_code,function(v,k,e){
				if(String(v.inviter_code) == String(invite_code)){
					use_rulesid = v.rules_id
				}
			})
			if(use_rulesid == "5735a787963c83f84cb1ff06"){
				invite_func(req,function(dtinv){
					next(dtinv)
				})
			}else{
				invite_promo(req,r,use_rulesid,function(dtpro){
					next(dtpro)
				})
			}
		}
	})
	
	
}

exports.get_inviter = function(req,res){
	var invite_code = req.params.code;
	var cond = {
		// "promo_code.type":"invite",
		"promo_code.inviter_code":invite_code
	}
	customers_coll.findOne(cond,function(err,r){
		var rules_id = ""
		async.forEachOf(r.promo_code,function(v,k,e){
			if(String(v.inviter_code) == String(invite_code)){
				rules_id = v.rules_id
			}
		})
		var cond2 = {
			_id:new ObjectId(rules_id),
			target_user:{$in:["not_member"]},
			promo_type:"credit"
		}
		promo_rules_coll.findOne(cond2,function(err,r2){
			r.rewards = r2.credit.amount_invitee
			res.json(r)
		})
	})
}

function invite_promo(req,rows_invitercust,use_rulesid,next){
	var post = req.body;
	var json = JSON.parse(post.data)
	var invite_code = post.invite_code;
	var uniq_id = post.uniq_id;
	
	var parseCode = String(randomString.alphaNumUpper(4,new Date().getTime()));
	var gencode = String(json.first_name+parseCode).toUpperCase();
	var inviter_code = gencode
	
	async.waterfall([
		function get_and_update_rules(cb){
			var cond = {
				_id:new ObjectId(use_rulesid)
			}
			promo_rules_coll.findOne(cond,function(err,r){
				if(err){
					debug.log(err);
					debug.log('error line 196 logi oauth');
					cb(null,false,[],{code_error:403})
				}else if(r == null){
					debug.log('error line 199 logi oauth');
					cb(null,false,[],{code_error:204})
				}else{
					var cond2 = {
						_id:new ObjectId(use_rulesid),
						"code.code":invite_code
					}
					var form_upd2 = {
						$push:{
							"code.$.used_at":{
								code:"",
								fb_id:json.id,
								created_at:new Date()
							}
						}
					}
					promo_rules_coll.update(cond2,form_upd2,function(err,upd){
						if(err){
							debug.log(err);
							debug.log('error line 219 oauth login');
							cb(null,false,[],{code_error:403})
						}else{
							cb(null,true,r,{})
						}
					})
					
				}
			})
			
		},
		function form_cust(stat,rows_rewards,code,cb){
			if(stat == true){
				var js = new Object();
				js.active = true;
				js.visible = true;
				js.fb_id = json.id;
				js.user_first_name = json.first_name;
				js.user_last_name = json.last_name;
				js.first_name = json.first_name;
				js.last_name = json.last_name;
				js.profile_image_url = "http://graph.facebook.com/"+json.id+"/picture?type=large";
				js.gender = json.gender
				js.email = json.email
				js.photos = ["http://graph.facebook.com/"+json.id+"/picture?type=large"]
				
				if(typeof json.bio == 'undefined'){
					js.about = ''
				}else{
					js.about = json.bio
				}
				
				if(typeof json.birthday == 'undefined'){
					js.birthday = ''
				}else{
					js.birthday = json.birthday
				}
				
				if(typeof json.location == 'undefined'){
					js.location = ''
				}else{
					js.location = json.location
				}
				js.created_at = new Date();
				js.last_login = new Date();
				js.updated_at = new Date();
				js.matchme = true;
				
				js.promo_code = [];
				js.promo_code[0] = new Object();
				js.promo_code[0].type = 'promo'
				js.promo_code[0].rules_id = use_rulesid
				js.promo_code[0].inviter_code = ""
				js.promo_code[0].invitee_code = invite_code
				js.promo_code[0].start_date = new Date()
				js.promo_code[0].end_date = req.app.get("helpers").intervalDateFilter(rows_rewards.credit.expiry_credit)
				
				subscribe_mailchimp(js,function(){});
				
				customers_coll.insert(js,function(err,ins){
					if(!err){
						var memins = new Object();
						memins.fb_id = json.id;
						memins.gender = json.gender;
						memins.notifications = {
							feed:true,
							location:true,
							chat:true
						}
						memins.updated_at = new Date();
						memins.account_type = "host";
						memins.experiences = [
							"Art & Culture", 
							"Fashion", 
							"Food & Drink", 
							"Family", 
							"Music", 
							"Nightlife"
						]
						if(json.gender == "male"){
							memins.gender_interest = "female"
						}else{
							memins.gender_interest = "male"
						}
						membersettings_coll.insert(memins,function(err,ins){
							if(!err){
								cb(null,true,js,rows_rewards,{})
							}
						})
					}else{
						debug.log(err);
						debug.log('error line 127 login oauth')
						cb(null,false,[],[],{code_error:403})
					}
				})
			}else{
				cb(null,false,[],[],code)
			}
		},
		function upd_credits(stat,js,rows_rewards,code,cb){
			if(stat == true){
				var points = rows_rewards.credit.amount_invitee;
				var from_fb_id = '';
				async.forEachOf(rows_rewards.code,function(v,k,e){
					if(v.code == invite_code){
						from_fb_id = v.used_by
					}
				})
				credit_points_coll.findOne({fb_id:json.id},function(err,r){
					if(r == null){
						var form_ins = {
							fb_id:json.id,
							totcredit_appinvite:parseInt(points),
							activity:[{
								rewards:parseInt(points),
								type:'promo',
								plot:'credit',
								flow:'get_from_promo',
								logs:{},
								from_fb_id:from_fb_id,
								updated_at:new Date(),
								rules_id:use_rulesid,
							}],
							created_at:new Date()
						}
						credit_points_coll.insert(form_ins,function(err,ins){
							if(err){
								debug.log('error insert credits 2')
							}else{
								js.rewards = points;
								cb(null,true,rows_rewards,js,{})
							}
							
						})
					}else{
						var totcredit_appinvite = parseInt(r.totcredit_appinvite)+parseInt(points)
						var cond_credit = {
							fb_id:json.id
						}
						var form_upd = {
							$set:{totcredit_appinvite:totcredit_appinvite},
							$push:{
								activity:{
									rewards:parseInt(points),
									type:'promo',
									plot:'credit',
									flow:'get_from_promo',
									logs:{},
									from_fb_id:from_fb_id,
									updated_at:new Date(),
									rules_id:use_rulesid
								}
							}
						}
						credit_points_coll.update(cond_credit,form_upd,function(err,upd){
							if(err){
								debug.log('error update credits')
							}else{
								js.rewards = points;
								js.from_fb_id = from_fb_id
								cb(null,true,rows_rewards,js,{})
							}
							
						})
					}
				})
			}else{
				cb(null,false,[],[],code)
			}
		},
		function replace_message(stat,rows_rewards,js,code,cb){
			if(stat == true){
				var msg = rows_rewards.message
				var invitee_full_name = js.first_name+' '+js.last_name
				var rewards = numeral(js.rewards).format('0,0')
				
				var m1 = msg.replace("{{invitee_full_name}}",invitee_full_name)
				var m2 = m1.replace("{{rewards}}",rewards)
				js.msg = m2
				cb(null,true,js,{})
			}else{
				cb(null,false,[],code)
			}
		}
	],function(err,stat,js,code){
		if(stat == true){
			next(js)
		}else{
			next(code)
		}
	})
}

function invite_func(req,next){
	var post = req.body;
	var json = JSON.parse(post.data)
	var invite_code = post.invite_code;
	var uniq_id = post.uniq_id;
	
	var parseCode = String(randomString.alphaNumUpper(4,new Date().getTime()));
	var gencode = String(json.first_name+parseCode).toUpperCase();
	var inviter_code = gencode
	
	async.waterfall([
		function get_and_update_rules(cb){
			var cond = {
				_id:new ObjectId('5735a787963c83f84cb1ff06')
			}
			promo_rules_coll.findOne(cond,function(err,r){
				if(err){
					debug.log(err);
					debug.log('error line 142 logi oauth');
					cb(null,false,[],[],{code_error:403})
				}else if(r == null){
					debug.log('error line 1425 logi oauth');
					cb(null,false,[],[],{code_error:204})
				}else{
					var cond = {
						_id:new ObjectId('5735a787963c83f84cb1ff06')
					}
					var form_upd = {
						$push:{
							code:{
								code:gencode,
								is_multiple:true,
								start_date:new Date(),
								end_date:req.app.get("helpers").intervalDateFilter(r.credit.expiry_credit),
								created_at:new Date(),
								used_at:[],
								used_by:json.id	
							}
						}
					}
					promo_rules_coll.update(cond,form_upd,function(err,upd){
						if(err){
							debug.log(err);
							debug.log('error line 166 oauth login')
							cb(null,false,[],{code_error:403})
						}else{
							setTimeout(function(){
								var cond2 = {
									_id:new ObjectId('5735a787963c83f84cb1ff06'),
									"code.code":invite_code
								}
								var form_upd2 = {
									$push:{
										"code.$.used_at":{
											code:gencode,
											fb_id:json.id,
											created_at:new Date()
										}
									}
								}
								promo_rules_coll.update(cond2,form_upd2,function(err,upd){
									if(err){
										debug.log(err);
										debug.log('error line 179 oauth login');
										cb(null,false,[],{code_error:403})
									}else{
										cb(null,true,r,{})
									}
								})
							},2000)
						}
					})
					
				}
			})
			
		},
		function form_cust(stat,rows_rewards,code,cb){
			if(stat == true){
				var js = new Object();
				js.active = true;
				js.visible = true;
				js.fb_id = json.id;
				js.user_first_name = json.first_name;
				js.user_last_name = json.last_name;
				js.first_name = json.first_name;
				js.last_name = json.last_name;
				js.profile_image_url = "http://graph.facebook.com/"+json.id+"/picture?type=large";
				js.gender = json.gender
				js.email = json.email
				js.photos = ["http://graph.facebook.com/"+json.id+"/picture?type=large"]
				
				if(typeof json.bio == 'undefined'){
					js.about = ''
				}else{
					js.about = json.bio
				}
				
				if(typeof json.birthday == 'undefined'){
					js.birthday = ''
				}else{
					js.birthday = json.birthday
				}
				
				if(typeof json.location == 'undefined'){
					js.location = ''
				}else{
					js.location = json.location
				}
				js.created_at = new Date();
				js.last_login = new Date();
				js.updated_at = new Date();
				js.matchme = true;
				
				js.promo_code = [];
				js.promo_code[0] = new Object();
				js.promo_code[0].type = 'invite'
				js.promo_code[0].rules_id = '5735a787963c83f84cb1ff06'
				js.promo_code[0].inviter_code = inviter_code
				js.promo_code[0].invitee_code = invite_code
				js.promo_code[0].start_date = new Date()
				js.promo_code[0].end_date = req.app.get("helpers").intervalDateFilter(rows_rewards.credit.expiry_credit)
				
				subscribe_mailchimp(js,function(){});
				
				customers_coll.insert(js,function(err,ins){
					if(!err){
						var memins = new Object();
						memins.fb_id = json.id;
						memins.gender = json.gender;
						memins.notifications = {
							feed:true,
							location:true,
							chat:true
						}
						memins.updated_at = new Date();
						memins.account_type = "host";
						memins.experiences = [
							"Art & Culture", 
							"Fashion", 
							"Food & Drink", 
							"Family", 
							"Music", 
							"Nightlife"
						]
						if(json.gender == "male"){
							memins.gender_interest = "female"
						}else{
							memins.gender_interest = "male"
						}
						membersettings_coll.insert(memins,function(err,ins){
							if(!err){
								cb(null,true,js,rows_rewards,{})
							}
						})
					}else{
						debug.log(err);
						debug.log('error line 127 login oauth')
						cb(null,false,[],[],{code_error:403})
					}
				})
			}else{
				cb(null,false,[],[],code)
			}
		},
		function upd_credits(stat,js,rows_rewards,code,cb){
			if(stat == true){
				var points = rows_rewards.credit.amount_invitee;
				var from_fb_id = '';
				async.forEachOf(rows_rewards.code,function(v,k,e){
					if(v.code == invite_code){
						from_fb_id = v.used_by
					}
				})
				credit_points_coll.findOne({fb_id:json.id},function(err,r){
					if(r == null){
						var form_ins = {
							fb_id:json.id,
							totcredit_appinvite:parseInt(points),
							activity:[{
								rewards:parseInt(points),
								type:'appinvite',
								plot:'credit',
								flow:'get_from_invite',
								logs:{},
								from_fb_id:from_fb_id,
								updated_at:new Date(),
								rules_id:'5735a787963c83f84cb1ff06',
							}],
							created_at:new Date()
						}
						credit_points_coll.insert(form_ins,function(err,ins){
							if(err){
								debug.log('error insert credits')
							}else{
								js.rewards = points;
								cb(null,true,rows_rewards,js,{})
							}
							
						})
					}else{
						var totcredit_appinvite = parseInt(r.totcredit_appinvite)+parseInt(points)
						var cond_credit = {
							fb_id:json.id
						}
						var form_upd = {
							$set:{totcredit_appinvite:totcredit_appinvite},
							$push:{
								activity:{
									rewards:parseInt(points),
									type:'appinvite',
									plot:'credit',
									flow:'get_from_invite',
									logs:{},
									from_fb_id:from_fb_id,
									updated_at:new Date(),
									rules_id:'5735a787963c83f84cb1ff06'
								}
							}
						}
						credit_points_coll.update(cond_credit,form_upd,function(err,upd){
							if(err){
								debug.log('error update credits')
							}else{
								js.rewards = points;
								js.from_fb_id = from_fb_id
								cb(null,true,rows_rewards,js,{})
							}
							
						})
					}
				})
			}else{
				cb(null,false,[],[],code)
			}
		},
		function replace_message(stat,rows_rewards,js,code,cb){
			if(stat == true){
				var msg = rows_rewards.message
				var invitee_full_name = js.first_name+' '+js.last_name
				var rewards = numeral(js.rewards).format('0,0')
				
				var m1 = msg.replace("{{invitee_full_name}}",invitee_full_name)
				var m2 = m1.replace("{{rewards}}",rewards)
				
				js.msg = m2
				cb(null,true,js,{})
			}else{
				cb(null,false,[],code)
			}
		}
	],function(err,stat,js,code){
		if(stat == true){
			next(js)
		}else{
			next(code)
		}
	})
}

function subscribe_mailchimp(user_item,callback){
	var util = require('util');
	var apiKey = "c1d7049153ed19e8424505abc495f565-us12";

	var mcapi = require('mailchimp-api')
	var MC = new mcapi.Mailchimp('c1d7049153ed19e8424505abc495f565-us12');
	var listIDMale = "0ca7cb8453";
	var listIDFemale = "eb9f283bf6";

	var listID = "8310248493";
	
	MC.lists.subscribe({
		id:listID, 
		email:{email:user_item.email},
		merge_vars:
			{
				FNAME:user_item.first_name,
				LNAME 	: user_item.last_name,
				MMERGE3 : user_item.fb_id,
				MMERGE4 : user_item.gender,
				MMERGE5 : user_item.birthday,
				MMERGE6 : user_item.location,
				MMERGE7 : user_item.created_at,
				MMERGE8 :user_item.about
			},
			update_existing:true,
			double_optin:false
	}, function(data)
	{
		callback()
		console.log("mailchimp====success=== " + util.inspect(data))
	},function(error)
	{
		callback()
		console.log("mailchimp====error=== " + error)
	});
}