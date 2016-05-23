exports.setting = function(app,express,helmet,hpp,xssFilters,validator,http,https,request,fs,passport,FacebookStrategy){
	// Middleware Using Passport //
	var APP_ID = "840535009393707";
	var APP_SECRET = "ecc8cbdc47f17f620c885784c7e57a04";
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
	  done(null, obj);
	});
	passport.use(new FacebookStrategy({
	    clientID: APP_ID,
	    clientSecret: APP_SECRET,
	    callbackURL: "https://api-dev.jiggieapp.com/auth/facebook/callback",
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
	
	
	// router //
	app.use(app.router);
	// router //

	app.use(function(req, res, next){
	  res.status(404);
	  if (req.accepts('html')) {
	    res.render('404', { url: req.url });
	    return;
	  }
	  if (req.accepts('json')) {
	    res.send({ error: 'Not found' });
	    return;
	  }
	  res.type('txt').send('Not found');
	});

	// development only //
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler());
	}
	// development only //
}