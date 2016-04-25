exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });

  var admin = require(path_controller+'admin');
  app.post('/admin/venue',admin.venue);
  app.post('/admin/event',admin.admin_event);
}