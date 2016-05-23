/**
 * Created By : Jannes Santoso
 * NodeJS : ExpressJS
 * Core API Development
 * V.1.2
 */  
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

/* S:Module dependencies. */
var http = require('http');
var https = require('https');
var fs = require("fs");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var controller = require('./controller');
var path = require('path');
var request = require('request');

var passport = require('passport');
var FacebookStrategy  = require('passport-facebook').Strategy;

// security //
var methodOverride = require('method-override');
var csrf = require('csurf');
var xssFilters = require('xss-filters');
var validator = require('validator');
var hpp = require('hpp');
var helmet = require('helmet');
var compression = require('compression');
// security //

/* E:Module dependencies */

/* S:Environment */
var environment = require("./config/environment");
environment.environ(app,express,helmet,path,compression,bodyParser);
/* E:Environment */

/* S:Settings */
var settings = require("./config/setting");
settings.setting(app,express,helmet,hpp,xssFilters,validator,http,https,request,fs,passport,FacebookStrategy);
/* E:Settings */

/* S:Router */
var routes = require('./config/routes');
var path_controller = path.join(__dirname, 'controller/');
routes.rerute(app,path_controller,csrf,bodyParser,passport,FacebookStrategy);
/* E:Router */

var launcher = require('./launcher');
launcher.execute(app,https,http,fs);