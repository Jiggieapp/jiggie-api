exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var notif = require(path_controller+'notif');
  app.post('/apn',notif.apn);
  
  var notif_all = require(path_controller+'notif');
  app.post('/apn_all',notif_all.apn);
}