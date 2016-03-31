var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    key = 'jannessantoso_1234567890_Admin123!';

var helpers = {
	encrypt : function(pass){
		var cipher = crypto.createCipher(algorithm,key)
		var crypted = cipher.update(pass,'utf8','hex')
		crypted += cipher.final('hex');
		return crypted;
	},
	intervalDate : function(days){
		var date = new Date();
		var intervalTime = date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var newDate = new Date(intervalTime);
		return newDate;
	},
	intervalDateFilter : function(days){
		var d = new Date();
		var date = new Date(d.getFullYear(),d.getMonth(), d.getDate());
		var intervalTime = date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var newDate = new Date(intervalTime);
		return newDate;
	},
	logging : function(type,method,api,req){
		var request = require('request');
		var log_url = "http://127.0.0.1:65400/log";
		var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		
		var form = {
			type : type,
			route : fullUrl,
			method : method,
			api : api
		}
		var options = {
			url : log_url,
			form : form
		}
		request.post(options,function(err,resp,body){
			if (!err && resp.statusCode == 200) {
				// debug.log(body);
			}else{
				// debug.log(err);
			}
		})
	},
	addHours : function(time,minute){
		var moment = require('moment');
		var dateString = moment(time).format('YYYY-MM-DD HH:mm:ss');
		var timeAdd = moment(dateString).add(minute,'minute');
		return new Date(timeAdd);
	},
	template_success: function(req){
		var fs = require('fs-sync');
		var path = require('path');
		var ppt = path.join(__dirname,"../../global/email.html");
		var html = fs.read(ppt);
		return html;
	},
	parseDate:function(dateutc,string_format){
		var momenttz = require('moment-timezone')
		var dt = momenttz(dateutc).tz('Asia/Jakarta').format(string_format);
		return dt
	}
}

module.exports = helpers;