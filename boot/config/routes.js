exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var event = require(path_controller+'event');
  app.get('/app/v3/events/list/:fb_id',event.index);
  app.get('/app/v3/event/details/:event_id/:fb_id/:gender_interest',event.details);
  app.get('/app/v3/event/interest/:event_id/:fb_id/:gender_interest',event.interest);
  app.get('/app/v3/partyfeed/match/:fb_id/:guest_fb_id/approved',event.match);
  app.get('/app/v3/event/likes/:event_id/:fb_id/:likes',event.likes);
  
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
  app.post('/app/v3/userlogin',login.userlogin); // Auth Token
  app.get('/app/v3/user/tagslist',login.tagslist);
  app.get('/app/v3/apntoken/:fb_id/:apn',login.sync_apntoken);
  app.get('/app/v3/user/phone/verification/send/:fb_id/:phone/:dial_code',login.sendSMS);
  app.get('/app/v3/user/phone/verification/validate/:fb_id/:token',login.validateSMS);
  app.post('/app/v3/count_walkthrough',login.sync_countwalkthrough);
  app.post('/app/v3/member/upload',login.upload_profileimage);
  app.get('/preload_profileimage',login.preload_profileimage);
  app.get('/parse_countrycode',login.parseCountryCode);
  app.get('/app/v3/list_countrycode',login.list_countryCode);
  app.post('/app/v3/save_longlat',login.save_longlat);
  app.get('/image/:img_file',login.show_image);

  var chat = require(path_controller+'chat');
  app.get('/app/v3/conversations',chat.list); // List Users Can be Chats;
  app.get('/app/v3/chat/conversation/:fb_id/:member_fb_id',chat.conversation);
  app.post('/app/v3/messages/add',chat.post_message);
  app.get('/app/v3/deletemessageswithfbid',chat.remove_listchat)
  app.get('/app/v3/blockuserwithfbid',chat.block_listchat);
  
  var share = require(path_controller+'share');
  app.get('/app/v3/invitelink',share.index);
  app.get('/s/:id',share.parseShareLink);
  app.get('/ss/:id',share.showParseShareLink);
  app.get('/app/v3/getshare/:fb_id',share.getshare);
  
  
  var commerce = require(path_controller+'commerce');
  app.get('/app/v3/product/list/:event_id',commerce.index);
  app.post('/app/v3/product/summary',commerce.post_summary);
  app.get('/app/v3/product/term/:codeid',commerce.term);
  app.post('/app/v3/product/payment',commerce.payment);
  app.get('/app/v3/product/credit_card/:fb_id',commerce.cc_info);
  app.post('/app/v3/product/post_cc',commerce.post_cc);
  app.post('/app/v3/product/delete_cc',commerce.delete_cc);
  app.get('/notif_handle',commerce.notifications_handler);
  app.get('/app/v3/product/order_list/:fb_id',commerce.order_list);
  app.get('/app/v3/product/success_screen/:order_id',commerce.success_screen);
  app.get('/app/v3/product/walkthrough_payment',commerce.walkthrough_payment);
  app.get('/app/v3/product/payment_method',commerce.get_paymentmethod);
  app.get('/app/v3/product/support',commerce.support);
  app.post('/app/v3/product/forward_support',commerce.forward_mail)
  app.get('/app/v3/product/guest_info/:fb_id',commerce.guest_info);
  app.post('/app/v3/product/free_payment',commerce.free_charge);
  
  var xmpp = require(path_controller+'xmpp');
  app.get('/xmpp/:user',xmpp.index);
  app.get('/ltx/:user',xmpp.ltx);
  
  var cron = require(path_controller+'cron');
  app.get('/start_autoschedule',cron.index)
  
  
  
  // Notif //
  var notif = require(path_controller+'notif');
  app.post('/notif',notif.index);
  app.post('/notif_all',notif.all);
  app.get('/th',notif.th);
  app.post('/do_roll',notif.th_nextround);
  // Notif //
}