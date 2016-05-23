var async = require('async');
var async = require('async');
var url = "http://127.0.0.1:1234";
var curl = require('request');
var Cookies = require("cookies");
var numeral = require('numeral')

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
	var busboy = new Busboy({ 
		headers: req.headers,
		// limits:{
			// files:1,
			// fileSize: 5000000
		// }
	});
	var app = req.app;
	
	var fs_sync = require('fs-sync');
	var path = require('path');
	var ppt = path.join(__dirname,"../../global/domain.json");
	var pkg = fs_sync.readJSON(ppt);
	var domain = pkg.uri
	
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		console.log(mimetype)
		if(mimetype == 'image/jpeg' || mimetype == 'image/png' || mimetype == 'image/jpg'){
			var saveTo = __dirname + '/../public/uploads/';

			var ext = filename.split('.');
			var now = new Date();
			var pt_file = now.getTime()+'.'+ext[1];
			var pathfile = saveTo+pt_file;
			
			// var permit = 0;
			// var fileSize = 0;
			// file.on('data', function(data) {                                          
			   // fileSize+=data.length;
			   // if (fileSize>5000000){ // 5MB
					// permit = 0;
					// res.json({msg:'filenya kegedean bos kecilin ngapa'})
			    // }else{
					// permit = 1
				// }
			// });
			
			
			console.log('Nama Tempat: '+pathfile);
			var fstream = fs.createWriteStream(pathfile)
			fstream.on('finish',function(){
				console.log('finish upload')
			})
			file.pipe(fstream);
					
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
						encoding:encoding,
						// permit:permit
					}
				}
				curl.post(options,function(err,resp,body){
					if (!err && resp.statusCode == 200) {
						// console.log(body)
						res.json({
							response:1,
							url:domain+'/image/'+pt_file
						})
					}
				})
			});
		}else{
			res.json({response:0,msg:'Not Images'})
		}
	});
	
	return req.pipe(busboy);
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

exports.remove_profileimage = function(req,res){
	var post = req.body;
	var options = {
		url : url+"/app/v3/remove_profileimage",
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

// Start:WebApps Invite //
exports.link_invite = function(req,res){
	var ppt = require('path').join(__dirname,"../../global/invite_url.json");
	var pkg = require('fs-sync').readJSON(ppt);
	var comurl = pkg.uri
	var invite_url = comurl+'/invite/';
	
	var cookies = new Cookies( req, res, { "keys": "jannessantoso_keys_1234567" } )
	var xssFilters = require('xss-filters');
	var invite_code = xssFilters.inHTMLData(req.params.code);
	var uniq_id = xssFilters.inHTMLData(req.params.uniq_id);
	cookies.set('invite_code',invite_code)
	cookies.set('uniq_id',uniq_id)
	
	var options = {
		url:url+'/get_inviter/'+invite_code+"/"+uniq_id
	}
	curl.get(options,function(err,resp,body){
		if(!err && resp.statusCode == 200){
			var inviter_data = JSON.parse(body);
			
			var photos = '';
			if(typeof inviter_data.photos != 'undefined' && inviter_data.photos.length > 0){
				photos = inviter_data.photos[0]
			}else{
				photos = "http://graph.facebook.com/"+inviter_data.fb_id+"/picture?type=large"
			}
			
			res.render('invite/index',{
				link_fb:comurl+"/auth/facebook",
				photos:photos,
				inviter_full_name:inviter_data.first_name+' '+inviter_data.last_name,
				rewards:numeral(inviter_data.rewards).format('0,0'),
				is_sign:false
			});
			
		}else{
			res.render('invite/index3',{})
		}
	})
	
	
}

exports.get_cookies = function(req,res){
	var cookies = new Cookies( req, res, { "keys": "jannessantoso_keys_1234567" } )
	var invite_code = cookies.get('invite_code');
	res.send(invite_code)
}


exports.authfb = function(req,res){
	var cookies = new Cookies( req, res, { "keys": "jannessantoso_keys_1234567" } )
	var invite_code = cookies.get('invite_code');
	var uniq_id = cookies.get('uniq_id');
	var u = req.user;
	var dt = JSON.stringify(u._json)
	var post = {data:dt,invite_code:invite_code,uniq_id:uniq_id}
	
	var device = getDevice(req.headers['user-agent']);
	
	var options = {
		url : url+"/post_fb",
		form : post
	}
	curl.post(options,function(err,resp,body){
		if (!err && resp.statusCode == 200) {
			var json_data = JSON.parse(body);
			if(typeof json_data.code_error != 'undefined'){
				res.status(json_data.code_error).send({});
			}else{
				if(json_data.response == 0){
					res.render('invite/index2',{
						photos:json_data.photos,
						is_sign:false,
						device:device
					})
				}else if(json_data.response == 1){
					var js = json_data.body;
					
					res.render('invite/index2',{
						photos:js.photos[0],
						invitee_full_name:js.first_name+' '+js.last_name,
						rewards:numeral(js.rewards).format('0,0'),
						device:device,
						message:js.msg,
						is_sign:true
					});
				}
			}
		}else{
			res.send(err);
		}
	})
}

exports.get_header = function(req,res){
	var device = getDevice(req.headers['user-agent']);
	res.json(device)
}

var getDevice = function(ua) {
    var $ = {active: false, subactive: false};

    if (/mobile/i.test(ua)) {
        $.active = 'mobile';
        $.Mobile = true;
    }

    if (/like Mac OS X/.test(ua)) {
        $.active = 'iOS';
        $.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
        if (/like Mac OS X/.test(ua)) {
            $.subactive = 'iPhone';
            $.iPhone = /iPhone/.test(ua);
        }
        if (/like Mac OS X/.test(ua)) {
            $.subactive = 'iPad';
            $.iPad = /iPad/.test(ua);
        }
    }

    if (/Android/.test(ua)) {
        $.active = 'Android';
        $.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];
    }

    if (/webOS\//.test(ua)) {
        $.active = 'webOS';
        $.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];
    }

    if (/(Intel|PPC) Mac OS X/.test(ua)) {
        $.active = 'Safari';
        $.Safari = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.') || true;
    }

    if (/Windows NT/.test(ua)) {
        $.active = 'IE';
        $.IE = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];
    }
    if (/MSIE/.test(ua)) {
        $.active = 'IE';
        $.IE = /MSIE ([0-9]+[\.0-9]*)/.exec(ua)[1];
    }
    if (/Trident/.test(ua)) {
        $.active = 'IE';
        $.IE = /Trident\/.*rv:([0-9]+[\.0-9]*)/.exec(ua)[1];
    }
    if (/Edge\/\d+/.test(ua)) {
        $.active = 'IE Edge';
        $.IE = /Edge\/(\d+)/.exec(ua)[1];
    }

    // return $.active + ' ' + $[$.active] + ($.subactive && ' ' + $.subactive + ' ' + $[$.subactive]); + ' ' + $[$.active] + ($.subactive && ' ' + $.subactive + ' ' + $[$.subactive]);
    return $.active;
};

// END:WebApps Invite //