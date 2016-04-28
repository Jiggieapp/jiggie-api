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
					msg : 'Success',
					data:json_data
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

exports.citylist = function(req,res){
	var fb_id = req.params.fb_id;
	
	var options = {
		url : url+'/app/v3/user/citylist'
	}
	curl.get(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			res.header("Content-type","application/json");
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				hr.data = new Object();
				hr.data.citylist = JSON.parse(body);
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
	
	var fs_sync = require('fs-sync');
	var path = require('path');
	var ppt = path.join(__dirname,"../../global/domain.json");
	var pkg = fs_sync.readJSON(ppt);
	var domain = pkg.uri
	
	
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(mimetype == 'image/jpeg' || mimetype == 'image/png' || mimetype == 'image/jpg'){
			var saveTo = __dirname + '/../public/uploads/';

			var ext = filename.split('.');
			var now = new Date();
			var pt_file = now.getTime()+'.'+ext[1];
			var pathfile = saveTo+pt_file;

			console.log('Nama Tempat: '+pathfile);
			file.pipe(fs.createWriteStream(pathfile));
					
			busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetypetxt) {
				console.log('save fbid photos')
				console.log(fieldname)
				console.log(val)
				var options = {
					url : url+"/app/v3/member/upload",
					form : {
						fb_id:val,
						url_img:domain+'/image/'+pt_file,
						filename:pt_file,
						mimetype:mimetype,
						encoding:encoding
					}
				}
				curl.post(options,function(err,resp,body){
					if (!err && resp.statusCode == 200) {
						console.log(body)
						res.json({response:1})
					}
				})
			});
		}else{
			console.log('Not Images');
		}
	});
	req.pipe(busboy);
}

exports.show_image = function(req,res){
	var img_file = req.params.img_file;
	var ext = img_file.split('.');
	
	var fs = require('fs');
	var path = require('path');
	var ppt = path.join(__dirname,"../public/uploads/"+img_file);
	
	fs.readFile(ppt,function(err,data){
		res.writeHead(200, {'Content-Type': 'image/'+ext[1]});
		res.end(data);
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