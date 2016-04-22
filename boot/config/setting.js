exports.setting = function(app,express,helmet,hpp,xssFilters,validator,http,https,request,fs,busboy,passport,FacebookStrategy){
	// Middleware Using Passport //
	var APP_ID = "820652081367246";
	var APP_SECRET = "aa48f82de39710f6676c4c9e223d440a";
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
	  done(null, obj);
	});
	passport.use(new FacebookStrategy({
	    clientID: APP_ID,
	    clientSecret: APP_SECRET,
	    callbackURL: app.get('domain')+"/auth/facebook/callback",
	    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified'],
	    scope:['email']
	    // passReqToCallback : true
	  },
	  function(accessToken, refreshToken, profile, done) {
	    // asynchronous verification, for effect...
	    process.nextTick(function () {
	      var oauth = { 
	        clientID    : APP_ID, 
	        clientSecret : APP_SECRET, 
	        accessToken  : accessToken, 
	        refreshToken    : refreshToken
	      }
	      return done(null, profile);
	      //console.log(profile);
	    });
	  }
	));
	// Middleware Using Passport //


	app.configure(function(){
	  app.use(express.cookieParser());
	  app.set('trust proxy', 1); // only use if behind proxy
	  app.use(express.session({
		secret:"jannes_santoso_secret_78685812311132112B7A7EF2B277FB6A2A9B1CBB4F522C2ECAD6EE116E6EDE216311AA8DA9B737214AB5AE82723BD8A7B3CB585E4E9BC6C4EEC12D33CCBCBDFE7865",
   	 	key:"jannes_santoso_67676345345355642bbhfhggsessionID",
	    cookie:{
	      httpOnly:true,
	      secure:true, // Secure only True if SSL Turn ON
	      maxAge: 600000
	    },
		resave: false,
		saveUninitialized: true,
		expires: true
	  }));

	  
	   app.use(function(req,res,next){
	    req.xssFilters = xssFilters;
	    next();
	  });

	  app.use(function(req,res,next){
	    req.validator = validator;
	    next();
	  });

	  app.use(function(req,res,next){
	    req.app = app;
	      next();
	  });

	  app.use(passport.initialize());
  	  app.use(passport.session());

	});

	// router //
	app.use(app.router);
	// router //

	// error handler //
	app.use(function (err, req, res, next) {
	  if (err.code !== 'EBADCSRFTOKEN') return next(err)
	 
	  // handle CSRF token errors here 
	  res.status(403)
	  res.send('form tampered with')
	});
	// error handler //

	app.use(function(req, res, next){
	  // res.status(404);
	  // if (req.accepts('html')) {
	    // res.render('404', { url: req.url });
	    // return;
	  // }
	  // if (req.accepts('json')) {
	    // res.send({ error: 'Not found' });
	    // return;
	  // }
	  // res.type('txt').send('Not found');
	  res.status(403)
	});

	// development only //
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler());
	}
	// development only //
}