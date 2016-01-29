exports.rerute = function(app,path_controller,csrf,bodyParser,passport){
  var csrfProtection = csrf({ cookie: true });
  var parseForm = bodyParser.urlencoded({ extended: false });

  var event = require(path_controller+'event');
  app.get('/app/v3/events/list/:fb_id',event.index); // Retrive Events Data
  
  var details = require(path_controller+'event_details');
  app.get('/app/v3/event/details/:event_id/:fb_id/:gender_interest',details.index); // Retrive Events Details Data
  
  var interest = require(path_controller+'event_interested');
  app.get('/app/v3/event/interest/:event_id/:fb_id/:gender_interest',interest.index); // Retrive Events Details Data
  app.get('/app/v3/partyfeed/match/:fb_id/:guest_fb_id/approved',interest.connect); // Sent Invitation To Connect
}