var jwt = require('jsonwebtoken');
var datakey = 'Wk0rXZTxsesP99giBjIm12Vbq8nPbW4c';
var moment = require("moment");
var debug = require('./../config/debug');

var token = {
	encoded : function(){
		var dt = getDateTime();
		var json = {
			expiry:dt
		};
		var token = jwt.sign(json,datakey);
		return token;
	},
	decoded : function(app,token){
		try{
			var dec = jwt.verify(token,datakey);
			
			var now = app.get("helpers").getDate();
			debug.log("NOW : "+now);
			var now_arr = now.split(" ");
			var now_arr2 = now_arr[0].split("-");
			var now_day = now_arr2[2];
			var now_month = now_arr2[1];
			var now_year = now_arr2[0];
			
			var exp = dec.expiry;
			debug.log("EXPIRY : "+exp);
			var exp_arr = exp.split(" ");
			var exp_arr2 = exp_arr[0].split("-");
			var exp_day = exp_arr2[2];
			var exp_month = exp_arr2[1];
			var exp_year = exp_arr2[0];
			
			var cek = moment([exp_year,exp_month,exp_day]).diff(moment([now_year,now_month,now_day]),true);
			debug.log(cek);
			
			debug.log(dec);
			if(cek > 0){
				var tes = {
					  "c": {
						"data": {
						  "error": false,
						  "message": "",
						  "content": {
							"user_id": 1,
							"nama": "opan",
							"phone": "0808080808"
						  }
						},
						"token": null,
						"timestamp": 1448012672016
					  }
					}
				return JSON.stringify(tes);
			}else{
				return "Token Expiry";
			}
		}catch(e){
			return 'Token Invalid';
		}
		
	}
}

function getDateTime() {

    var date = new Date();
	date.setDate(date.getDate()+7); // expiry 7 days

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth();
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
		
	// Convert Date to UTC 0 //
	// var moment = require("moment");
	// var d = moment().format("MMMM Do YYYY, h:mm:ss a");
	// var dn = moment.utc().format("YYYY MM D dd h:mm:ss a");
	
	// var r = moment.utc().format("YYYY-MM-D hh:mm:ss");
	// var dt = moment(r).unix();
	// console.log(d); // UTC +7 Default
	// console.log(dn); // UTC +0
	// console.log(r);
	// console.log(dt); // Timestamp UTC +0
	// Convert Date to UTC 0 //

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
}

module.exports = token;