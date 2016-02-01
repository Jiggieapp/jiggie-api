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
	decrypt : function(pass){
		var decipher = crypto.createDecipher(algorithm,key)
 		var dec = decipher.update(pass,'hex','utf8')
  		dec += decipher.final('utf8');
 		return dec;
	},
	getDate : function(){
		now = new Date();
		year = "" + now.getFullYear();
		month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
		day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
		hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
		minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
		second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
		return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
	},
	convertDate : function(dt){
		now = new Date(dt);
		year = "" + now.getFullYear();
		month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
		day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
		hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
		minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
		second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
		return year + "-" + month + "-" + day;
	},
	opt : function(rows,select_id,field){
		var t = '';
		var async = require('async');
		async.forEachOf(rows,function(val,key,err){
			if(val['id'] == select_id){
				t += '<option value="'+val['id']+'" selected>'+val[field]+'</option>';	
			}else{
				t += '<option value="'+val['id']+'">'+val[field]+'</option>';
			}
			
		});
		return t;
	},
	save_users : function(session,val){
		session.front_users = val;
		session.save(function(err){
			console.log('Session Err :'+err);
		});
	},
	get_users : function(session){
		return session.front_users[0];
	},
	update_points : function(app,session,add_poins){
		var se = require('./../models/se');

		var users = app.get('helpers').get_users(session);
		var cond = 'email = "'+users.email+'" and source = "'+users.source+'"';
		se.update_points(app,cond,add_poins,function(upd){
			console.log(upd);
		});
	},
	cond : function(session,state){
		var users = session.front_users[0];
		if(state == 'users'){
			return 'id = '+users.id+' and status = "yes"';
		}else if(state == 'profile'){
			return 'profile_id = '+users.id+' and status = "yes"';
		}
	},
	filter_array : function(arr){
		var n = arr.filter(function(i){
			return i != '';
		});
		return n;
	},
	check_array_byvalue : function(arr,val){
		if(arr.indexOf(val) > -1){
			// in array 
		}else{
			// not in array
		}
	}
}

module.exports = helpers;