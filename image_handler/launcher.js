exports.execute = function(app,https,http,fs){
	var server = http.createServer(app);
	server.listen(app.get('port'), function(req,res){
		var curl = require('request');
		setTimeout(function(){
			curl.get({url:'http://127.0.0.1:10897/upload_s3'},function(err,resp,body){});
		},15000)
	  console.log("HTTPS: "+app.get('port'));
	});
}
