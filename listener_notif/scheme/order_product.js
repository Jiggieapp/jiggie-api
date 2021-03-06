var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var varScheme = new Schema({
	// id : {type:Number,required:true,index: {unique: true, dropDups: true}, default: },
	
	order_id:{type:String,default:''},
	code : {type:String, min:6, max:6,required:true},
	order_status : {type:String, enum:['checkout_incompleted','checkout_completed','pending_payment','pending_shipment','shipped','completed','cancel'],required:true},
	payment_status : {type:String, enum:['awaiting_payment','paid','refund','expire','void'],required:true},
	product_list : [{
		ticket_type : {type:String, enum:['purchase','booking'],required:true},
		max_buy : {type:String, default:''},
		min_deposit_percent : {type:String, default:''},
		min_deposit_amount : {type:String, default:''},
		num_buy : {type:String, required:true},
		total_price : {type:String, required:true},
		total_price_aftertax : {type:String, required:true},
		name:{type:String,required:true},
		ticket_id:{type:String,required:true},
		quantity:{type:String,required:true},
		admin_fee:{type:String,required:true},
		tax_percent:{type:String,required:true},
		tax_amount:{type:String,required:true},
		tip_percent:{type:String,required:true},
		tip_amount:{type:String,required:true},
		currency:{type:String,required:true},
		price:{type:String,required:true},
		total_price_all:{type:String,required:true},
		terms:[{
			label:{type:String,default:''},
			body:{type:String,default:''}
		}],
		payment_timelimit:{type:String,required:true},
	}],
	fb_id:{type:String,required:true},
	event_id:{type:String,required:true},
	guest_detail:{
		name:{type:String,required:true},
		email:{type:String,required:true},
		phone:{type:String,default:''}
	},
	total_tax_amount:{type:String,required:true},
	total_tip_amount:{type:String,required:true},
	total_adminfee:{type:String,required:true},
	total_price:{type:String,required:true},
	created_at  :  { type: Date, default: Date.now }
});

module.exports = mongoose.model('order_product', varScheme);    