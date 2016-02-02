"use strict";

var MongoClient = require('mongodb').MongoClient;
// var mongoUri = 'mongodb://heroku_2r193ckp:41mfu21bpd68ed1ccg913g271n@ds057994-a0.mongolab.com:57994,ds057994-a1.mongolab.com:57994/heroku_2r193ckp?replicaSet=rs-ds057994';
var mongoUri = 'mongodb://localhost:27017/local';
var debug = require('./../config/debug');

function connect(callback)
{
    MongoClient.connect(mongoUri,function(error, db){       
        if(error){console.log(error)}else{
			callback(db);
		}

    });
}

var mongo = {
	find : function(coll,cond,callback){
		connect(function(db){
			var collection = db.collection(coll);
			collection.find(cond).toArray(function(err,rows){
				if(err){
					debug.log(err);
					callback("err");
				}else{
					callback(rows);
				}
			});
		})
	},
	findOne : function(coll,cond,callback){
		connect(function(db){
			var collection = db.collection(coll);
			collection.findOne(cond,function(err,rows){
				if(err){
					debug.log(err);
					callback("err");
				}else{
					callback(rows);
				}
			});
		})
	},
	insert : function(coll,data,callback){
		connect(function(db){
			var collection = db.collection(coll);
			collection.insert(data,function(err,result){
				if(err){
					debug.log(err);
					callback("err");
				}else{
					callback(result);
				}
			})
		});
	},
	update : function(coll,cond,set,callback){
		connect(function(db){
			var collection = db.collection(coll);
			collection.update(cond,{$set:set},function(err,result){
				if(err){
					debug.log(err);
					callback("err");
				}else{
					callback(result);
				}
			});
		})
	},
	remove : function(coll,cond,callback){
		connect(function(db){
			var collection = db.collection(coll);
			collection.delete(cond,function(err,result){
				if(err){
					debug.log(err);
					callback("err");
				}else{
					callback(result);
				}
			});		
		});
	}
	
}

module.exports = mongo;
