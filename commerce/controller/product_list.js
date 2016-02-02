require('./../models/emit');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');


exports.index = function(req, res){
	req.app.get("helpers").logging("request","get","",req);
	
	
};

function get_data(req,next){
	var event_id = req.params.event_id;
	
	async.waterfall([
		function get_eventdetails(cb){
			events_detail_coll.findOne({_id:new ObjectId(event_id)},function(err,r){
				if(r != null){
					if(r.fullfillment_type == 'ticket'){
						cb(null,1);
					}else{
						cb(null,0);
					}
				}else{
					cb(null,0);
				}
			})
		},
		function get_ticket(cek,cb){
			if(cek == 1){
				tickettypes_coll.find({event_id:event_id}).toArray(function(err,r){
					
				})
			}else{
				cb(null,0);
			}
		}
	],function(){
		
	})
	
	
}
