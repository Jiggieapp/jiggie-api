var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// var varScheme = new Schema({
	// id : {type:Number,required:true,index: {unique: true, dropDups: true} },
	// name : {type:String, default:'kosong'},
	// age : {type:Number, min:18},
	// bio   :  { type: String, match: /[a-z]/ },
	// date  :  { type: Date, default: Date.now }
	// index : true
// });

var varScheme = new Schema({
	active : {type:Boolean, default:true},
	visible : {type:Boolean, default:true},
	fb_id   :  { type: String, required:true },
	apn_token  :  { type: String, default:"" },
	user_first_name : {type : String, default:""},
	user_last_name : {type : String, default:""},
	first_name : {type : String, default:""},
	last_name : {type : String, default:""},
	profile_image : {type : String, default:""},
	gender : {type : String, default:"female"},
	email : {type : String, default:""},
	photos : {type : String, default:""},
	about : {type : String, default:""},
	birthday : {type : String, default:""},
	location : {type : String, default:""},
	userId : {type : String, default:""},
	created_at : {type : Date, default:Date.now},
	last_login : {type : Date, default:Date.now},
	updated_at : {type : Date, default:Date.now},
	birth_date : {type : String, default:""},
	user_ref_name : {type : String, default:"n/a"},
	user_ref_fb_id : {type : String, default:""},
	ref_count : {type : Number, default:0},
	appsflyer : {type:String, default:""},
	mixpanel : {type:String, default:""},
	chat_count : {type:String, default:""},
	twilio_token : {type:String, default:""},
	tmp_token : {type:String, default:""},
	gender_interest : {type:String, default:""},
	match_me : {type:Boolean, default:true},
	phone : {type:String, default:""}
});

module.exports = mongoose.model('customers', varScheme);