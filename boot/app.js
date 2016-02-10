/**
 * Created By : Jannes Santoso
 * NodeJS : ExpressJS + EJS
 * FrontEnd Development
 * V.1.2
 */  
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
console.log("CPU Worker : "+numCPUs);

// if (cluster.isMaster) {

  // for (var i = 0; i < numCPUs; i++) {
    // cluster.fork();
  // }

  // cluster.on('online', function(worker) {
      // console.log('Worker ' + worker.process.pid + ' is online');
  // });

  // cluster.on('exit', function(worker, code, signal) {
      // console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
      // console.log('Starting a new worker');
      // cluster.fork();
  // });
// } else {


/* S:Module dependencies. */
var http = require('http');
var https = require('https');
// var ports = seaport.connect('localhost',4300);
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var controller = require('./controller');
var path = require('path');
var request = require('request');
var compression = require('compression');
var fs = require('fs');
var passport = require('passport');
var FacebookStrategy  = require('passport-facebook').Strategy;

// security //
var methodOverride = require('method-override');
var csrf = require('csurf');
var xssFilters = require('xss-filters');
var validator = require('validator');
var hpp = require('hpp');
var helmet = require('helmet');
// security //

var busboy = require('connect-busboy');

/* E:Module dependencies */

/* S:Environment */
var environment = require("./config/environment");
environment.environ(app,express,helmet,path,compression,bodyParser);
/* E:Environment */

/* S:Settings */
var settings = require("./config/setting");
settings.setting(app,express,helmet,hpp,xssFilters,validator,http,https,request,fs,busboy,passport,FacebookStrategy);
/* E:Settings */

/* S:Router */
var routes = require('./config/routes');
var path_controller = path.join(__dirname, 'controller/');
routes.rerute(app,path_controller,csrf,bodyParser,passport);
/* E:Router */

var launcher = require('./launcher');
launcher.execute(app,https,http,fs);

// var memwatch = require('memwatch');
// memwatch.setup();
// memwatch.on('leak', function(info) {
 // console.error('Memory leak detected: ', info);
// });

// }