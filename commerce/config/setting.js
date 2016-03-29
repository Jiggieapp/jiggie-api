exports.setting = function(app,express,helmet,hpp,xssFilters,validator,http,https,request,fs,busboy){
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