exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });

  var login = require(path_controller+'login');
  app.post('/app/v3/login',login.index); // login API
  app.post('/app/v3/membersettings',login.sync_membersettings); // Sync to membersettings collections
  app.post('/app/v3/user/sync/superproperties/:fb_id',login.sync_mixpanel); // Sync to customers.mixpanel collections
  app.post('/app/v3/appsflyerinfo',login.sync_appsflyer); // Sync Apps Flyer Info in customers collections
  app.post('/app/v3/updateuserabout',login.sync_about); // Update user About
  app.post('/app/userlogin',login.userlogin); // Auth Token
  app.get('/app/v3/user/tagslist',login.tagslist);
  
  
  var membersettings = require(path_controller+'membersettings');
  app.get('/app/v3/membersettings',membersettings.index);
  app.get('/app/v3/memberinfo/:fb_id',membersettings.memberinfo);
}