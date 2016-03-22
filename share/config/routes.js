exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var share = require(path_controller+'share');
  app.get('/app/v3/invitelink',share.invitelink); // Invite
  app.get('/lookuplink/:id',share.lookuplink); // lookuplink
  
  var other = require(path_controller+'other');
  app.get('/app/v3/getshare/:fb_id',other.getshare);
}