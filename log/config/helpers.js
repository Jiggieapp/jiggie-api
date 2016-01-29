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
	}
}

module.exports = helpers;