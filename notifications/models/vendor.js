var db = require('./../config/database');
var vendor = {
	insert : function(app,table,data,callback){
		data['create_date'] = app.get('helpers').getDate();
		db.mysql(function(connection){
			var q = connection.query('insert into '+table+' set ?',data,function(err,rows){
				if(err) console.log(err);
				callback(rows);
			});
			connection.end();
		});
	},
	findOne : function(table,email,callback){
		db.mysql(function(connection){
			var q = connection.query("select * from "+table+' where email = "'+email+'"',function(err,rows){
				if(err) console.log(err);
				callback(rows);
			});
			connection.end();
		});
	},
	findOne1 : function(table,cond,callback){
		db.mysql(function(connection){
			var q = connection.query("select * from "+table+' where '+cond,function(err,rows){
				if(err) console.log(err);
				callback(rows);
			});
			console.log(q.sql);
			connection.end();
		});
	},
	update : function(app,table,data,cond,callback){
		data['modify_date'] = app.get('helpers').getDate();
		db.mysql(function(connection){
			var q = connection.query('update '+table+' set ? where '+cond,data,function(err, rows){
				if(err) console.log(err);
				callback(rows);
			});
			console.log(q.sql);
			connection.end();
		});
	},
	getAll : function(table,cond,callback){
		if(cond == ''){
			db.mysql(function(connection){
				var q = connection.query('select * from '+table,function(err, rows){
					if(err) console.log(err);
					callback(rows);
				});
				connection.end();
			});
		}else{
			db.mysql(function(connection){
				var q = connection.query('select * from '+table+' where '+cond,function(err, rows){
					if(err) console.log(err);
					callback(rows);
				});
				connection.end();
				console.log(q.sql);
			});
			
		}
	},
	getWhereIn : function(table,field,data,callback){
		var params = [];
		for(var i=0; i< (data.length-1); i++){
			// params.push('$'+i);
			params.push(data[i]);
		}
		db.mysql(function(connection){
			var q = connection.query('select * from '+table+' where '+field+' in('+params.join(',')+')',data,function(err, rows){
				if(err) console.log(err);
				callback(rows);
			});
			console.log(q.sql);
			connection.end();
		});
	},
	del : function(table,cond,callback){
		db.mysql(function(connection){
			var q = connection.query('delete from '+table+' where '+cond,function(err,rows){
				if(err) console.log(err);
				callback(rows);
			});
			connection.end();
			console.log(q.sql);
		});
	}
}

module.exports = vendor;