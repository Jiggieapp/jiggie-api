exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });
  
  var product_list = require(path_controller+'product_list');
  app.get('/app/v3/product/list/:event_id',product_list.index);
  app.post('/app/v3/product/summary',product_list.post_summary);
  
  var payment = require(path_controller+'payment');
  app.post('/app/v3/product/payment',payment.index);
  app.post('/app/v3/product/free_payment',payment.free_charge);
  
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
  app.get('/app/v3/product/payment_method',other.get_paymentmethod);
  app.get('/app/v3/product/support',other.support);
  app.get('/app/v3/product/guest_info/:fb_id',other.guest_info);
  app.post('/handle_cancel_vt',other.handle_cancel_vt);
  
  var credit = require(path_controller+'credit');
  app.post('/app/v3/credit/invite',credit.invite);
  app.post('/app/v3/credit/invite_all',credit.invite_all);
  app.post('/app/v3/credit/contact',credit.contact);
  app.get('/app/v3/credit/invite_code/:fb_id',credit.invite_code);
  app.post('/app/v3/credit/redeem_code',credit.redeem_code);
  app.get('/app/v3/credit/balance_credit/:fb_id',credit.balance_credit);
  
  var discount = require(path_controller+'discount');
  app.post('/app/v3/discount',discount.index);
}