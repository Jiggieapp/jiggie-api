exports.environ = function(app,express,helmet,path,compression,bodyParser){
	//app.disable("x-powered-by");
	app.use(helmet.hidePoweredBy({ setTo: "x-powered-by : Jannes Santoso" }));
	app.set('port', process.env.PORT || 31213);
	app.set('views', path.join(__dirname, '../views'));
	app.set('view engine', 'ejs');
	app.set('public',path.join(__dirname, '../public'));
	app.set('path_public','/../');
	app.set('helpers',require('./helpers'));
	app.use(express.logger('dev'));

	app.use(express.json());
	app.use(express.urlencoded());

	app.use(express.methodOverride("X-HTTP-Method-Override"));
	app.use(express.static(path.join(__dirname, '../public')));
}