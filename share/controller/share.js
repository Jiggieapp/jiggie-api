require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');

var moment = require('moment');
var crypto = require('crypto');
var HashidsNPM = require("hashids");
var Hashids = new HashidsNPM("bfdlkKjlKBKJBjkbk08y23h9hek",6,"1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");

var basedomain = 'http://jigg.io';
// var trackdomain = 'http://app.appsflyer.com';
var trackdomain = 'https://jiggieapp.onelink.me';

exports.invitelink = function(req, res){
	req.app.get("helpers").logging("request","get","",req);

	var json_data = new Object();
	var type = req.param('type');
	var from_fb_id = req.param('from_fb_id');
	
	if(type == 'general'){
		json_data.message = 'Get Jiggie to discover cool events and meet fun new people!';
		
		var cond = {
			from_fb_id:from_fb_id,
			type:type
		}
		invitelinks_coll.findOne(cond,function(err,rows){
			if(rows != null){
				json_data.url = basedomain + "/" + rows.hash;
				res.json(json_data);
			}else{
				createLink(from_fb_id,type,function(item){
					addInviteLink(item,function(err,result){
						json_data.url = basedomain + "/" + item.hash;
						res.json(json_data);
					})
				})
			}
		})
	}else{
		var event_id = req.param('event_id');
		var venue_name = req.param('venue_name');
		
		events_detail_coll.findOne({_id:new ObjectId(event_id)},function(err,rows){
			if(rows != null){
				json_data.message = "Let's get Jiggie at "  + rows.title +  ". ";
				
				var cond = {
					from_fb_id:from_fb_id,
					type:type,
					event_id:event_id
				}
				invitelinks_coll.findOne(cond,function(err,dt){
					if(dt != null){
						json_data.url = basedomain + "/" + dt.hash;
						res.json(json_data);
					}else{
						var dataobj = new Object();
						dataobj.from_fb_id = from_fb_id;
						dataobj.type = type;
						dataobj.hosting_id = req.param('hosting_id');
						dataobj.event_id = event_id;
						dataobj.venue_name = venue_name;
						createHostingLink(dataobj,function(item){
							addInviteLink(item,function(err,result){
								json_data.url = basedomain + "/" + item.hash;
								res.json(json_data);
							})
						})
					}
				})
			}else{
				res.json({success:false,code:'Event ID Invalid'});
			}
		})
	}
}


// https://jiggieapp.onelink.me/1630402100?pid=test_source&c=no_campaign&af_dp=jiggie%3A%2F%2F&af_force_dp=true

/* share app*/
//https://jiggieapp.onelink.me/1630402100?pid=App_Invite&c=Fazlur_Rahman&af_dp=jiggie%3A%2F%2Fevent_list&af_web_dp=http%3A%2F%2Fwww.jiggieapp.com%2F&af_chrome_lp=true&advertising_id=ec5dae50-51a1-491c-ab27-8eb268e347f7&af_sub1=10205703989179267

/*share event*/
//https://jiggieapp.onelink.me/1630402100?pid=Event_Invite&c=Fazlur_Rahman&af_dp=jiggie%3A%2F%2Fevent_detail%2F56eb91c59e2ca3030021aa02&af_web_dp=http%3A%2F%2Fwww.jiggieapp.com%2F&af_chrome_lp=true&af_sub1=10205703989179267&af_sub2=56eb91c59e2ca3030021aa02&advertising_id=ec5dae50-51a1-491c-ab27-8eb268e347f7

exports.lookuplink = function(req,res)
{
	var data = new Object();
	var hash = req.params.id;
	invitelinks_coll.findOne({hash:hash},function(err,item)
	{
		if(item)
		{
			data.success = true;
			customers_coll.findOne({fb_id:item.from_fb_id},function(err2,r){
				if(item.type != "general")
				{
					// data.url = trackdomain  + "/" + "id1047291489?pid=Event_Invite&af_dp=jiggie%3A%2F%2F&af_sub1=" + item.from_fb_id + "&af_sub2=" + item.event_id + "&af_ios_lp=true";
					// data.url = trackdomain  + "/" + "1630402100?pid=Event_Invite&c="+r.first_name+"_"+r.last_name+"&af_dp=jiggie%3A%2F%2F&af_sub1=" + item.from_fb_id + "&af_sub2=" + item.event_id + "&af_force_dp=true&af_ios_lp=true&af_chrome_lp=true";
					data.url = trackdomain  + "/" + "1630402100?pid=Event_Invite&c="+r.first_name+"_"+r.last_name+"&af_dp=jiggie%3A%2F%2Fevent_detail%2F"+item.event_id+"&af_web_dp=http%3A%2F%2Fwww.jiggieapp.com%2F&af_chrome_lp=true&af_sub1="+item.from_fb_id+"&af_sub2="+item.event_id;
				}else{
					// data.url = trackdomain + "/id1047291489?pid=App_Invite&af_dp=jiggie%3A%2F%2F&af_sub1=" + item.from_fb_id + "&af_ios_lp=true";
					// data.url = trackdomain + "/1630402100?pid=App_Invite&c="+r.first_name+"_"+r.last_name+"&af_dp=jiggie%3A%2F%2F&af_sub1=" + item.from_fb_id + "&af_force_dp=true&af_ios_lp=true&af_chrome_lp=true";
					data.url = trackdomain + "/1630402100?pid=App_Invite&c="+r.first_name+"_"+r.last_name+"&af_dp=jiggie%3A%2F%2Fevent_list&af_web_dp=http%3A%2F%2Fwww.jiggieapp.com%2F&af_chrome_lp=true&af_sub1=" + item.from_fb_id;
				}
				res.send(data.url);
			})
		}else{
			data.success = false;
			res.send('/');
		}
	});
}

function createHash(callback)
{
	getInviteLinkCount(function(sum)
	{
		callback(Hashids.encode(Number(sum + 100000)));
	})
}


function createLink(from_fb_id,type,callback)
{
	var data = new Object();
	data.created_at = new Date();
	data.last_updated = new Date();
	data.from_fb_id = from_fb_id;
	data.type = type;
	createHash(function(hash)
	{
		data.hash = hash;
		callback(data);
	});
}


function createHostingLink(obj,callback)
{
	var data = new Object();
	data.created_at = new Date();
	data.last_updated = new Date();
	data.from_fb_id = obj.from_fb_id;
	data.type = obj.type;
	data.hosting_id = obj.hosting_id;
	data.event_id = obj.event_id;
	//data.host_fb_id = obj.host_fb_id;
	//data.host_date = obj.host_date;
	//data.host_name = obj.host_name;
	data.venue_name = obj.venue_name;
	createHash(function(hash)
	{
		data.hash = hash;
		callback(data);
	});
}

function addInviteLink(data,callback)
{
	invitelinks_coll.insert(data,
	{
		safe: true
	}, callback);
}

function findInviteLinkByFBIDAndType(from_fb_id,type,callback)
{
	invitelinks_coll.findOne({from_fb_id:from_fb_id,type:type},callback);
}


function findInviteLinkByFBIDAndTypeAndEventId(from_fb_id,type,event_id,callback)
{
	invitelinks_coll.findOne({from_fb_id:from_fb_id,type:type,event_id:event_id},callback);
}

function findInviteLinkByHash(hash,callback)
{
	invitelinks_coll.findOne({hash:hash},callback);
}

function getInviteLinkCount(callback)
{
	invitelinks_coll.count(function(err,result)
	{
		debug.log(result);
		callback(result);
	})
}

