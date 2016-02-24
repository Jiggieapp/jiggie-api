require('./../models/emit');
var debug = require('./../config/debug');
var cache = require('./../config/cache');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');



exports.index = function(req, res){
	var days = 8; // Interval Data for Events
	var from_date = new Date();
	var to_date = req.app.get("helpers").intervalDate(days);
	
	
	debug.log(from_date);
	debug.log(to_date);
	
	customers_coll.findOne({fb_id:req.params.fb_id},function(errrs,cek){
		if(cek == undefined){
			// 403 => Invalid ID Facebook
			res.json({code_error:403})
		}else{
			// cache.get('eventlist',function(errcache,valcache){
				// if(typeof valcache == 'undefined'){
					get_data(req,req.params.fb_id,from_date,to_date,function(err,rows){
						if(err){
							req.app.get("helpers").logging("response","get",JSON.stringify({success:false}),req);
							res.json({success:false});
						}else{
							req.app.get("helpers").logging("response","get",JSON.stringify(rows),req);
							// cache.set('eventlist',rows,function(err,suc){
								// if(suc == true){
									// debug.log('not cached');
									if(rows == null || typeof rows == 'undefined' || rows.length == 0){
										// 204 => No Content
										res.json({code_error:204})
									}else{
										res.json(rows);
									}
								// }
							// })
							
						}
					});
				// }else{
					// debug.log('cached');
					// res.json(valcache);
				// }
			// })
			
		}
	})
	
	
};

function get_data(req,fb_id,from_date,to_date,next){
	var to_date_filter = req.app.get("helpers").intervalDateFilter(7);
	async.waterfall([
		function step1(callback){
			membersettings_coll.findOne({fb_id:fb_id},function(err,cr){
				var tags = [];
				if(cr == null){
					tags = [];
				}else{
					tags = cr.experiences
				}
				callback(null,tags);
			});
		},
		function step2(dt_tags,callback){
			if(dt_tags == undefined){
				var cond = {
					end_datetime:{
						$gte : from_date
					},
					start_datetime:{
						$lte : to_date
					},
					active:{$ne:false},
					status:'published'
				}
			}else if(dt_tags.length == 0){
				var cond = {
					end_datetime:{
						$gte : from_date
					},
					start_datetime:{
						$lte : to_date
					},
					active:{$ne:false},
					status:'published'
				}
			}else{
				var cond = {
					tags:{
						$in:dt_tags
					},
					end_datetime:{
						$gte : from_date
					},
					start_datetime:{
						$lte : to_date
					},
					active:{$ne:false},
					status:'published'
				}
			}
			
			events_detail_coll.find(cond).sort({start_datetime:1}).toArray(function(err,rows){
				if(err){
					debug.log(err);
				}else{
					callback(null,rows);
				}
			});
		},
		function step3(rows_event,callback){
			var in_data_venue = [];
			async.forEachOf(rows_event,function(v,k,e){
				in_data_venue[k] = new Object();
				in_data_venue[k] = new ObjectId(v.venue_id);
			})
			// debug.log(in_data_venue);
			
			var photos;
			var cond = {
				_id:{$in:in_data_venue}
			}
			venues_coll.find(cond).toArray(function(err,rows_venue){
				callback(null,rows_event,rows_venue);
			});
		}
	],function(err,rows_event,rows_venue){
		// debug.log(rows_event);
		var json_data = [];
		if(rows_event.length > 0 ){
			async.forEachOf(rows_event,function(v,k,e){
				json_data[k] = new Object();
				json_data[k]._id = v._id;
				json_data[k].rank = v.rank;
				json_data[k].title = v.title;
				json_data[k].venue_name = v.venue_name;
				json_data[k].start_datetime = v.start_datetime;
				json_data[k].end_datetime = v.end_datetime;
				json_data[k].special_type = "Trending";
				json_data[k].tags = v.tags;
				
				if(v.source == 'featured'){
					json_data[k].date_day = 'Featured Events';
				}else{
					var d = new Date(v.start_datetime);
					json_data[k].date_day = getDay(d.getDay());
				}
				
				var dd = new Date(v.start_datetime);
				json_data[k].start_date = new Date(dd.getFullYear(),dd.getMonth(),dd.getDate());
				
				json_data[k].photos = new Object();
				
				if(v.photos.length > 0){
					var convert_original_photos = [];
					async.forEachOf(v.photos,function(v2,k2,e2){
						var str = v2.indexOf('original');
						if(str != -1){
							var ex = v2.split('/');
							var ex2 = ex[ex.length-1];
							var ex3 = ex2.split('.');
							var str1 = ex3[0].replace('original','540');
							
							
							ex[ex.length-1] = str1+'.jpg';
							convert_original_photos[k2] = ex.join('/');
						}else{
							// ini dinyalain klo semua image udah dimigrasi ke 540
							// var ex = v2.split('/');
							// var ex2 = ex[ex.length-1];
							// var ex3 = ex2.split('.');
							// var str1 = ex3[0]+'_540.jpg';
							
							// ex[ex.length-1] = str1;
							// convert_original_photos[k2] = ex.join('/');
							
							convert_original_photos[k2] = v2;
						}
					});
					json_data[k].photos = convert_original_photos;
				}else{
					async.forEachOf(rows_venue,function(vv,kk,ee){
						if(vv._id == v.venue_id){
							json_data[k].photos = vv.photos;
						}
					})
				}
				
			});
			json_data.sort(sortRank);
		}
		
		var filtered_array = [];
		var n = 0;
		async.forEachOf(json_data,function(v,k,e){
			if(v.start_date <= to_date_filter){
				filtered_array[n] = v;
			}
			n++;
		})
		
		// debug.log(filtered_array);
		
		next(err,filtered_array);
	});
}

function getDay(dayIndex){
	return ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][dayIndex];
}

var sortRank = function(a,b){
	// Sort Asc Start Datetime//
	if(a.start_datetime < b.start_datetime) return -1; 
	if(a.start_datetime > b.start_datetime) return 1;
	
	//Sort Desc Rank//
	if(a.rank < b.rank) return 1;
	if(a.rank > b.rank) return -1;
	return 0;
}
