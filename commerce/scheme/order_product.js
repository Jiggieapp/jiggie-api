var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var varScheme = new Schema({
	// id : {type:Number,required:true,index: {unique: true, dropDups: true}, default: },
	
	ticket_id : {type:String, default:''},
	event_id : {type:String, default:''},
	name : {type:String, default:''},
	ticket_type : {type:String, default:''},
	quantity : {type:Number, default:0},
	total_price : {type:Number, default:0},
	
	num_buy : {type:Number, default:0},
	total_price_all : {type:Number, default:0},
	fb_id : {type:String,required:true},
	// bio   :  { type: String, match: /[a-z]/ },
	created_at  :  { type: Date, default: Date.now }
});

module.exports = mongoose.model('order_product', varScheme);    