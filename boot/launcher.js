exports.execute = function(app,https,http,fs){
	var sc = 'jannessantoso@gmail.com';
	var seaport = require('seaport',{secret:sc});
	var ports = seaport.connect(9090);

	// HTTP //
	// var server = http.createServer(app);
	// var server_1 = http.createServer(app);
	// var server_2 = http.createServer(app);
	// HTTPS //
	var options = {
	    key: fs.readFileSync('/home/ubuntu/ssl/server.key'),
	    cert: fs.readFileSync('/home/ubuntu/ssl/server.crt'),
	    // key: fs.readFileSync('C:/cygwin64/home/jannes/node/apps/master/ssl/server.key'),
	    // cert: fs.readFileSync('C:/cygwin64/home/jannes/node/apps/master/ssl/server.crt'),
	    requestCert: false,
	    rejectUnauthorized: false
	};
	var server = https.createServer(options, app);
	// var server_2 = https.createServer(options, app);
	// var server_1 = require('http2').createServer(options,app);
	// var server_2 = require('http2').createServer(options,app);
	// server_1.listen(ports.register('web@1.2.1'));
	// server_2.listen(ports.register('web@1.2.2'));

	// HTTP2 //
	/*var options = {
	  key: fs.readFileSync('./example/localhost.key'),
	  cert: fs.readFileSync('./example/localhost.crt')
	};

	require('http2').createServer(options, function(request, response) {
	  response.end('Hello world!');
	}).listen(8080);*/

	server.listen(app.get('port'), function(req,res){
	  console.log("HTTPS: "+app.get('port'));
	});


}
