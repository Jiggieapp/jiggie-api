var async = require('async');
var async = require('async');
var url = "http://127.0.0.1:1234";
var curl = require('request');

var hr = new Object();
hr.response = 1;
hr.msg = "success";

exports.index = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/login",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.login = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.sync_membersettings = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/membersettings",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.sync_mixpanel = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/user/sync/superproperties/:fb_id",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.sync_appsflyer = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/appsflyerinfo",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.membersettingsGet = function(req,res){
	var fb_id = req.param('fb_id');
	
	var options = {
		url : url+'/app/v3/membersettings?fb_id='+fb_id
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.membersettings = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.memberinfo = function(req,res){
	var fb_id = req.params.fb_id;
	
	var options = {
		url : url+'/app/v3/memberinfo/'+fb_id
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.memberinfo = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.sync_about = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/updateuserabout",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.userlogin = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/userlogin",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.tagslist = function(req,res){
	var fb_id = req.params.fb_id;
	
	var options = {
		url : url+'/app/v3/user/tagslist'
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.tagslist = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.sync_apntoken = function(req,res){
	var fb_id = req.params.fb_id;
	
	var options = {
		url : url+'/app/v3/apntoken/'+req.params.fb_id+'/'+req.params.apn
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.sendSMS = function(req,res){
	var fb_id = req.params.fb_id;
	var phone = req.params.phone;
	var dial_code = req.params.dial_code;
	
	var options = {
		url : url+'/app/v3/user/phone/verification/send/'+fb_id+'/'+phone+'/'+dial_code
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.validateSMS = function(req,res){
	var fb_id = req.params.fb_id;
	var token = req.params.token;
	
	var options = {
		url : url+'/app/v3/user/phone/verification/validate/'+fb_id+'/'+token
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.sync_countwalkthrough = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/count_walkthrough",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.upload_profileimage = function(req,res){
	var fs = require('fs');
	var async = require('async');
	var Busboy = require('busboy');
	var busboy = new Busboy({ headers: req.headers });
	var app = req.app;
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(mimetype == 'image/jpeg' || mimetype == 'image/png' || mimetype == 'image/jpg'){
			var saveTo = __dirname + '/../public/uploads/';

			var ext = filename.split('.');
			var now = new Date();
			var pt_file = now.getTime()+'.'+ext[1];
			var pathfile = saveTo+pt_file;

			console.log('Nama Tempat: '+pathfile);
			file.pipe(fs.createWriteStream(pathfile));
					
			setTimeout(function(){
				upload_s3(app,pathfile,pt_file,mimetype,encoding,function(res_aws){
					console.log('send s3')
					console.log(res_aws);
					
					fs.unlink(pathfile,function(err_unlink){
						console.log('delete local')
						res.json({response:1})
					})
				});
			},10000)
			
			busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
				console.log('save fbid photos')
				console.log(fieldname)
				console.log(val)
				var options = {
					url : url+"/app/v3/member/upload",
					form : {
						fb_id:val,
						path_file:'https://s3-ap-southeast-1.amazonaws.com/jiggieprofileimage/'+pt_file
					}
				}
				curl.post(options,function(err,resp,body){
					if (!err && resp.statusCode == 200) {
						console.log(body)
					}
				})
			});
				
			
		}else{
			console.log('Not Images');
		}
	});
	req.pipe(busboy);
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

exports.preload_profileimage = function(req,res){
	var fb_id = req.params.fb_id;
	var token = req.params.token;
	
	var options = {
		url : 'http://127.0.0.1:10897/preload/profile'
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}

exports.parseCountryCode = function(req,res){
	var fb_id = req.params.fb_id;
	var token = req.params.token;
	
	var options = {
		url : url+'/parse_countrycode'
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				res.send(json_data);
			}
		}else{
			res.send(err);
		}
	})
}

exports.list_countryCode = function(req,res){
	var fb_id = req.params.fb_id;
	var token = req.params.token;
	
	var options = {
		url : url+'/app/v3/list_countrycode'
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.list_countryCode = JSON.parse(body);
				res.send(hr);
			}
		}else{
			res.send(err);
		}
	})
}

exports.save_longlat = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/save_longlat",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				var rsp = {
					response : 1,
					msg : 'Success'
				}
				res.send(rsp);
			}
		}else{
			res.send(err);
		}
	})
}