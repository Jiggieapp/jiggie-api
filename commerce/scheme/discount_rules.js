var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

var varScheme = new Schema({
	"name": {type: String, default: ''},
	"type": {type: String, enum: ['%', 'fix']},
	"amount": {type: Number, required: true},
	"max_amount": {type: Number, required: true}, //use only if type %
	"target": [{user: [],
		category: [],
		event: [],
		payment: [],
		ticket: [],
		table: []
	}],
	"has_code": {type: Boolean, default: false},
	"code": [{
		code: {type: String, default: ''},
		is_multiple: {type: Boolean, default: false},
		start_date: {type: Date, default: ''},
		end_date: {type: Date, default: ''},
		created_at: {type: Date, default: Date.now()},
		used_at: {type: Date, default: ''},
		used_by: {type: String, default: ''}
	}],
	start_date: {type: Date, default: ''},
	end_date: {type: Date, default: ''},
	is_active: {type: Boolean, default: false},
	negate: {type: Boolean, default: false},
	promo_type:{type:String,enum:['discount','credit']}
	}, { timestamps: { createdAt: 'created_at',  updatedAt: 'updated_at'} 
});

module.exports = mongoose.model('promo_rules', varScheme);    