require('./../models/emit');
var debug = require('./../config/debug');
var cache = require('./../config/cache');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var request = require('request');
var fs = require('fs')
var cron = require('cron').CronJob;
var _ = require('underscore')

var redis   = require("redis");
var client_redis  = redis.createClient(6379,"jiggieappsredis.futsnq.0001.apse1.cache.amazonaws.com");

exports.index = function(req, res){
	var fb_id = req.params.fb_id;
	var key_id = req.params.id;
	
	customers_coll.findOne({fb_id:fb_id},function(err,r){
		if(!err && r != null){
			var img_url = r.photos[key_id]
			debug.log(img_url)
			
			request
			.get(img_url)
			.on('response', function(response) {
				console.log(response.statusCode) // 200
				console.log(response.headers['content-type']) // 'image/png'
				
			  })
			.pipe(res);
		}
	})
};

exports.event = function(req,res){
	var img_url = req.param('url')
	
	request
	.get(img_url)
	.on('response', function(response) {
		console.log(response.statusCode) // 200
		console.log(response.headers['content-type']) // 'image/png'
		
	  })
	.pipe(res);
}

exports.preload_profile = function(req,res){
	customers_coll.find({}).toArray(function(err,r){
		if(!err && r.length > 0){
			async.forEachOf(r,function(v,k,e){
				if(typeof v.photos != 'undefined'){
					async.forEachOf(v.photos,function(ve,ke,ee){
						var url_def = 'http://img.jiggieapp.com/image/'+v.fb_id+'/'+ke+'/?imgid='+ve
						var options = {
							url:url_def
						}
						request.get(options,function(err,resp,body){
							debug.log(url_def)
							debug.log(resp.statusCode)
						})
					})
				}
			})
		}
	})
	res.json({success:true})
}

exports.upload_s3 = function(req,res){
	var job = new cron({
	  cronTime: '*/10 * * * * *',
	  onTick: function() {
		uploading_s3(req,function(dt){
			
		})
	  },
	  start: true,
	  timeZone: 'Asia/Jakarta'
	});
	job.start();
	res.json({success:true})
}

function uploading_s3(req,next){
	var app = req.app;
	image_temp_coll.find({}).toArray(function(err,r){
		async.forEachOf(r,function(v,k,e){
			var url_img = v.url_img
			var pathfile = '/home/ubuntu/boot/public/uploads/'+v.filename
			var pt_file = v.filename
			var mimetype = v.mimetype
			var encoding = v.encoding;
			var intervalTime = addMinutes(v.created_at,5)
			var dtnow = new Date();
			
			if(dtnow >= intervalTime){
				upload_s3(app,pathfile,pt_file,mimetype,encoding,function(res_aws){
					if(res_aws){
						fs.unlink(pathfile,function(err_unlink){
							var cond2 = {
								fb_id:v.fb_id,
								photos:url_img
							}
							var upd_form = {
								$set:{
									"photos.$":'https://s3-ap-southeast-1.amazonaws.com/jiggieprofileimage/'+pt_file
								}
							}
							customers_coll.update(cond2,upd_form,function(ers,upd){
								if(!ers){
									image_temp_coll.deleteOne({_id:new ObjectId(v._id)},function(erd,del){})
								}
							})
						})
					}
				});
			}
		})
	})
	next({success:true})
}

function s3_config(callback){
	var s3 = require('s3');
	var client = s3.createClient({
		maxAsyncS3: 200,     // this is the default
		s3RetryCount: 300,    // this is the default
		s3RetryDelay: 10000, // this is the default
		multipartUploadThreshold: 2097152000, // this is the default (20 MB)
		multipartUploadSize: 1572864000, // this is the default (15 MB)
		s3Options: {
			accessKeyId: "AKIAJGC4JWEYS64OOVUA",
			secretAccessKey: "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",
			region: "ap-southeast-1",
		},
	});
	callback(client);
}

function upload_s3(app,pathfile,filename,mimitype,encoding,callback){
	s3_config(function(client){
		var params = {
			localFile: pathfile,
			s3Params: {
				Bucket: "jiggieprofileimage",
				Key: filename,
				ACL: 'public-read',
				ContentType : mimitype,
				// ContentEncoding: encoding
			},
		};
		var uploader = client.uploadFile(params);
		uploader.on('error', function(err) {
			console.error("unable to upload:", err.stack);
		});
		uploader.on('progress', function() {
			console.log("progress", uploader.progressMd5Amount,uploader.progressAmount, uploader.progressTotal);
		});
		uploader.on('end', function() {
			console.log("done uploading");
		});
		callback('next upload s3');
	})
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

exports.migrate_new_s3 = function(req,res){
	var app = req.app;
	
	client_redis.get('migrate_dev3',function(err,val){
		if(val == null){
			var cond = {"photos":/original/}
		}else{
			var notin = [];
			var n = 0;
			async.forEachOf(JSON.parse(val),function(v,k,e){
				notin[n] = new ObjectId(v);
				n++;
			})
			var cond = {
				"photos":/original/,
				_id:{$nin:notin}
			}
		}
		
		events_detail_coll.find(cond,{limit:300}).toArray(function(err,r){
			if(err){
				debug.log(err)
				debug.log('data errors');
				res.json({success:false})
			}else{
				if(r.length == 0){
					debug.log('data empty');
					res.json({success:false})
				}else{
					var id_in = []
					var q = 0;
					
					async.forEachOf(r,function(v,k,e){
						if(typeof v.photos != 'undefined' && v.photos.length > 0){
							async.forEachOf(v.photos,function(ve,ke,ee){
								var img_url = ve;
								var ex = img_url.split('/');
								var filename = ex[ex.length-1];
								
								var mime = filename.split('.');
								var comp_filename = mime[0].replace('original','540');
								var new_file = comp_filename+'.jpg';
								var new_url = 'https://s3-us-west-2.amazonaws.com/cdnpartyhost/'+new_file
								
								var mimetype = '';
								if(mime[1] == 'png'){
									mimetype = 'image/png'
								}else if(mime[1] == 'jpg'){
									mimetype = 'image/jpeg'
								}else if(mime[1] == 'jpeg'){
									mimetype = 'image/jpeg'
								}
								
								var pathfile = '/home/ubuntu/image_handler/image_temp/'+new_file
								var w = fs.createWriteStream(pathfile)
								
								request
								.get(new_url)
								.on('response', function(response) {
									console.log(response.statusCode) // 200
									console.log(response.headers['content-type']) // 'image/png'
									
								  })
								.pipe(w);
								
								w.on('finish',function(){
									upload_s3(app,pathfile,new_file,mimetype,'',function(res_aws){
										if(res_aws){
											
										}
									});
								})
								
							})
						}
						id_in[q] = v._id;
						q++;
					})
					
					if(val == null){
						client_redis.set("migrate_dev3",JSON.stringify(id_in),function(err,suc){
							if(!err){debug.log('cached first')}
						});
					}else{
						var new_arr = [];
						new_arr = _.union(JSON.parse(val),id_in)
						client_redis.set("migrate_dev3",JSON.stringify(new_arr),function(err,suc){
							if(!err){debug.log('cached continue')}
						});
					}
					
					res.json({success:true})
				}
			}
			
		})
		
		
	})
	
}