exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var product_list = require(path_controller+'product_list');
  app.get('/app/v3/product/list/:event_id',product_list.index);
  app.post('/app/v3/product/summary',product_list.post_summary);
  
  var payment = require(path_controller+'payment');
  app.post('/app/v3/product/payment',payment.index);
  
  // var notif = require(path_controller+'notifications-handler');
  // app.get('/notif_handle',notif.index);
  // app.post('/sendnotif',notif.sendnotif)
  
  var other = require(path_controller+'other');
  app.get('/credit_card/:fb_id',other.cc_info);
  app.post('/post_cc',other.post_cc);
  app.post('/delete_cc',other.delete_cc);
  app.get('/order_list/:fb_id',other.order_list);
  app.get('/success_screen/:order_id',other.success_screen);
  app.get('/walkthrough_payment',other.walkthrough_payment);
}