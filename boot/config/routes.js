exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var event = require(path_controller+'event');
  app.get('/app/v3/events/list/:fb_id',event.index);
  app.get('/app/v3/event/details/:event_id/:fb_id/:gender_interest',event.details);
  app.get('/app/v3/event/interest/:event_id/:fb_id/:gender_interest',event.interest);
  app.get('/app/v3/partyfeed/match/:fb_id/:guest_fb_id/approved',event.match);
  
  var social = require(path_controller+'social');
  app.get('/app/v3/partyfeed/list/:fb_id/:gender_interest',social.index); // List Social Feed
  app.get('/app/v3/partyfeed_socialmatch/match/:fb_id/:member_fb_id/:match',social.connect); // Connecting Social Match;
  app.get('/app/v3/partyfeed/settings/:fb_id/:matchme',social.upd_matchme);
  
  var login = require(path_controller+'login');
  app.post('/app/v3/login',login.index);
  app.post('/app/v3/membersettings',login.sync_membersettings);
  app.get('/app/v3/membersettings',login.membersettingsGet);
  app.post('/app/v3/user/sync/superproperties/:fb_id',login.sync_mixpanel);
  app.post('/app/v3/appsflyerinfo',login.sync_appsflyer);
  app.get('/app/v3/memberinfo/:fb_id',login.memberinfo);
  app.post('/app/v3/updateuserabout',login.sync_about);

  var chat = require(path_controller+'chat');
  app.get('/app/v3/conversations',chat.list); // List Users Can be Chats;
  app.get('/app/v3/chat/conversation/:fb_id/:member_fb_id',chat.conversation);
  app.post('/app/v3/messages/add',chat.post_message);
  app.get('/app/v3/deletemessageswithfbid',chat.remove_listchat)
  app.get('/app/v3/blockuserwithfbid',chat.block_listchat);
  
  var share = require(path_controller+'share');
  app.get('/app/v3/invitelink',share.index);
}