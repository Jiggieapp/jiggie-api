exports.environ = function(app,express,helmet,path,compression,bodyParser){
	//app.disable("x-powered-by");
	app.use(helmet.hidePoweredBy({ setTo: "x-powered-by : Jannes Santoso" }));
	app.set('port', process.env.PORT || 24534);
	app.set('views', path.join(__dirname, '../views'));
	app.set('view engine', 'ejs');
	app.set('public',path.join(__dirname, '../public'));
	app.set('mongo_path',path.join(__dirname, '../scheme'));
	app.set('path_public','/../');
	app.set('helpers',require('./helpers'));
	app.use(express.logger('dev'));
	
	/*mail env*/
	app.set('mail_host','smtp.mandrillapp.com');
	app.set('mail_port',587);
	app.set('mail_user','cto@jiggieapp.com');
	app.set('mail_pass','4HilaY1jFATpOsjOXgUXoQ');
	
	// app.set('mail_host','smtp.mandrillapp.com');
	// app.set('mail_port',587);
	// app.set('mail_user','jiggie');
	// app.set('mail_pass','VuGDhbjMxIW5D6QPcUJ5Lg');
	/*mail env*/

	app.use(express.json());
	app.use(express.urlencoded());

	app.use(express.methodOverride("X-HTTP-Method-Override"));
	app.use(express.static(path.join(__dirname, '../public')));
}