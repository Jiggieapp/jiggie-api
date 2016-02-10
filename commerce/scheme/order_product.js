var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var varScheme = new Schema({
	// id : {type:Number,required:true,index: {unique: true, dropDups: true}, default: },
	
	code : {type:String, min:12, max:12},
	status : {type:String, enum:['summary','confirmation','unpaid','paid','cancel']},
	product_list : [{
		ticket_type : {type:String, enum:['purchase','reservation']},
		num_buy : {type:String, default:'0'},
		total_price : {type:String, default:'0'},
		name:{type:String,default:'n'},
		ticket_id:{type:String,default:'n'},
		total_price_all:{type:String,default:'0'}
	}],
	fb_id:{type:String,required:true},
	event_id:{type:String,required:true},
	total_price:{type:String,required:true},
	created_at  :  { type: Date, default: Date.now }
});

module.exports = mongoose.model('order_product', varScheme);    