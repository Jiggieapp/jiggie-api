exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });

  var log = require(path_controller+'log');
  app.post('/log',log.index); // Logging
}