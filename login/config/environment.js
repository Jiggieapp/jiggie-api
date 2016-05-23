exports.environ = function(app,express,helmet,path,compression,bodyParser){
	//app.disable("x-powered-by");
	app.use(helmet.hidePoweredBy({ setTo: "x-powered-by : Jannes Santoso" }));
	app.set('port', process.env.PORT || 1234);
	app.set('views', path.join(__dirname, '../views'));
	app.set('view engine', 'ejs');
	app.set('base_url','http://127.0.0.1:4300');
	app.set('domain','http://jannessantoso.com');
	app.set('public',path.join(__dirname, '../public'));
	app.set('path_public','/../');
	app.set('helpers',require('./helpers'));
	app.use(express.logger('dev'));

	app.use(express.json());
	app.use(express.urlencoded());

	app.use(express.methodOverride("X-HTTP-Method-Override"));
	app.use(express.static(path.join(__dirname, '../public')));
}