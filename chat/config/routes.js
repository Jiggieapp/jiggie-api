exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var list = require(path_controller+'list');
  app.get('/app/v3/conversations',list.list); // List Users Can be Chats;
  app.get('/app/v3/deletemessageswithfbid',list.remove); // Remove List Chats
  app.get('/app/v3/blockuserwithfbid',list.block); // Block List Chats

  var conversation = require(path_controller+'conversation');
  app.get('/app/v3/chat/conversation/:fb_id/:member_fb_id',conversation.index); // List Users Can be Chats;
  app.post('/app/v3/messages/add',conversation.post_message);
  
  
}