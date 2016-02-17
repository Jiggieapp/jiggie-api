exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var product_list = require(path_controller+'product_list');
  app.get('/app/v3/product/list/:event_id',product_list.index);
  app.post('/app/v3/product/summary',product_list.post_summary);
  
  
  var confirmation = require(path_controller+'confirmation');
  app.get('/app/v3/product/confirmation/:codeid',confirmation.index);
  app.get('/app/v3/product/term/:codeid',confirmation.termagreement);
}