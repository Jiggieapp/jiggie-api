require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var request = require('request');

var HashidsNPM = require("hashids");
var Hashids = new HashidsNPM("bfdlkKjlKBKJBjkbk08y23h9hek",6,"1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");

exports.index = function(req, res){
		
};