exports.index = function(req, res){
	console.log(req.app.get('helpers').get_users(req.session));
	var app = req.app;
	res.render('index',{
		path:app.get('public'),
		title:'Index Admin'
	});
};
