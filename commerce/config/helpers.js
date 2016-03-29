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
		var momenttz = require('moment-timezone');
		var dt_moment = momenttz.tz(dateutc,'Asia/Jakarta');
		var nformat = dt_moment.format()
		debug.log(nformat);
		
		var moment = require('moment');
		// var dtmoment = moment(nformat).format('ddd, DD MMM YYYY');
		var dtmoment = moment(nformat).format(string_format);
		
		return dtmoment;

			
	}
}

module.exports = helpers;