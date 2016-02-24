require('./../models/emit');
require('./../models/mongoose');
var debug = require('./../config/debug');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var ObjectIdM = require('mongoose').Types.ObjectId; 
var curl = require('request');

var comurl = 'https://commerce.jiggieapp.com/VT/examples/';
var cron = require('cron').CronJob;

var crypto = require('crypto');

exports.index = function(req, res){
	var job = new cron({
	  cronTime: '*/1 * * * * *',
	  onTick: function() {
		notifications_handler(req,function(mailsent){
			debug.log(mailsent);
		})
	  },
	  start: true,
	  timeZone: 'Asia/Jakarta'
	});
	job.start();
	res.send(1);
};

function notifications_handler(req,next){
	// var signaturekey = crypto.createHmac('sha512', 'a secret');
	
	
	var host = 'smtp.mandrillapp.com';
	var port = 587;
	var user = 'jannessantoso@gmail.com';
	var pass = '4HilaY1jFATpOsjOXgUXoQ';
	
	var from = 'jannessantoso@gmail.com';
	var to = 'arman@jiggieapp.com';
	var subject = 'TES BRO INI SEMUA HANYA TES';
	var html = '<html><strong>TES BRO INI SEMUA HANYA TES</strong></html>';
	
	var nodemailer = require('nodemailer');
	var transporter = nodemailer.createTransport({
		host: host,
		port: port,
		auth: {
			user: user,
			pass: pass
		}
	});
	var mailOptions = {
		from: from, 
		to: to, 
		subject: subject, 
		text: subject, 
		html: html
	};
	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			next(error);
		}else{
			// callback('Message sent: ' + info.response);
			next(info);
		}
	});
}