exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var social = require(path_controller+'social');
  app.get('/app/v3/partyfeed/list/:fb_id/:gender_interest',social.index); // List Social Feed
  app.get('/app/v3/partyfeed_socialmatch/match/:fb_id/:member_fb_id/:match',social.connect); // Connecting Social Match;
  app.get('/app/v3/partyfeed/settings/:fb_id/:matchme',social.upd_matchme); // Updating Matchme;
  app.get('/app/v3/partyfeed/count/:fb_id',social.count_data);
  app.get('/parse_event_id_chat',social.parseDataChatEventId); // Updating Matchme;

  var friends = require(path_controller+'friends');
  app.post('/app/v3/credit/social_friends',friends.social_friends)
  app.post('/app/v3/credit/list_social_friends',friends.list_social_friends)
}