exports.environ = function(app,express,helmet,path,compression,bodyParser){
	//app.disable("x-powered-by");
	app.use(helmet.hidePoweredBy({ setTo: "x-powered-by : Jannes Santoso" }));
	app.set('port', process.env.PORT || 4300);
	app.set('views', path.join(__dirname, '../views'));
	app.set('view engine', 'ejs');
	app.set('path_public','/../');
	app.set('path_images','https://s3-ap-southeast-1.amazonaws.com/imagesarcd');
	app.set('helpers',require('./helpers'));
	app.set('token',require('./token'));
	// app.use(express.favicon());
	app.use(express.logger('dev'));

	app.use(express.json({limit:'50mb'}));
	app.use(express.urlencoded({limit:'50mb'}));
	
	app.use(express.methodOverride("X-HTTP-Method-Override"));
	app.use(compression({level:9}));
	app.use(express.static(path.join(__dirname, '../public')));
}