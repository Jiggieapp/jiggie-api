var schema = {
	login : function(){
		var q = {};
		q['username'] = 'username';
		q['password'] = 'password';
		q['level_id'] = 'level_id';
		q['email'] = 'email';
		q['source'] = 'source';
		return q;
	},
	default : function(){
		var q = {};
		q['user_id'] = 'user_id';
		q['create_date'] = 'create_date';
		q['modify_user_id'] = 'modify_user_id';
		q['modify_date'] = 'modify_date';
		q['status'] = 'status';
		return q;
	}
}

module.exports = schema;