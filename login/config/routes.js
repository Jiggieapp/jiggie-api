exports.rerute = function(app,path_controller,csrf,bodyParser,passport,FacebookStrategy){
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
  app.get('/app/v3/user/citylist',login.citylist);
  app.get('/app/v3/apntoken/:fb_id/:apn',login.sync_apntoken);
  app.post('/app/v3/count_walkthrough',login.sync_countwalkthrough);
  
  
  var membersettings = require(path_controller+'membersettings');
  app.get('/app/v3/membersettings',membersettings.index);
  app.get('/app/v3/memberinfo/:fb_id',membersettings.memberinfo);
  app.get('/app/v3/user/phone/verification/send/:fb_id/:phone/:dial_code',membersettings.sendSMS);
  app.get('/app/v3/user/phone/verification/validate/:fb_id/:token',membersettings.validateSMS);
  app.post('/app/v3/member/upload',membersettings.upload_profileimage);
  app.get('/parse_countrycode',membersettings.parseCountryCode);
  app.get('/app/v3/list_countrycode',membersettings.list_countryCode);
  app.post('/app/v3/save_longlat',membersettings.save_longlat);
  app.post('/app/v3/remove_profileimage',membersettings.remove_profileimage);
  
  var oauth = require(path_controller+'oauth');
  app.post('/post_fb',oauth.post_fb);
  app.get('/get_inviter/:code/:uniq_id',oauth.get_inviter);
}