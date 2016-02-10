exports.execute = function(app,https,http,fs){
	var sc = 'jannessantoso@gmail.com';
	var seaport = require('seaport',{secret:sc});
	var ports = seaport.connect(9090);
	
	var path = require('path');
	var ppt = path.join(__dirname,"../global/cert.json");
	fs.readFile(ppt,"utf-8",function(err,data){
		var obj = JSON.parse(data);
		var options = {
			key: fs.readFileSync(obj.key),
			cert: fs.readFileSync(obj.crt),
			requestCert: false,
			rejectUnauthorized: false
		};
		var server = https.createServer(options, app);
		
		server.listen(app.get('port'), function(req,res){
		  console.log("HTTPS: "+app.get('port'));
		});
	});
}
