exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });

  var image = require(path_controller+'image');
  app.get('/image/:fb_id/:id',image.index); // handle image
  app.get('/preload/profile',image.preload_profile); // handle image
  app.get('/upload_s3',image.upload_s3); // handle image
  app.get('/migrate_s3',image.migrate_new_s3); // handle image
  app.get('/event',image.event); // handle image
  
  
}