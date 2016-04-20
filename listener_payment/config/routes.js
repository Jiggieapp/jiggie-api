exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });

  var commerce_notif = require(path_controller+'notifications-handler');
  app.get('/notif_handle',commerce_notif.index);
  app.post('/sendnotif',commerce_notif.sendnotif)
  app.post('/forward_support',commerce_notif.forward_mail)
}