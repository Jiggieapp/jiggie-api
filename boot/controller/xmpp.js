// var events = require('events');
// var eventEmitter = new events.EventEmitter();
// exports.eventEmitter = eventEmitter;
// eventEmitter.setMaxListeners(0);
var xmpp = require('simple-xmpp');
xmpp.connect({
	jid                 : 'admin@jannesjiggie-pc/Ressource',
	password        	: 'Admin123!',
	port                : 5222
});
// eventEmitter.emit('XMPP Connected');



exports.index = function(req,res){
	xmpp.on('online', function(data) {
		console.log('Connected with JID: ' + data.jid.user);
		console.log('Yes, I\'m connected!');
	});

	xmpp.on('chat', function(from, message) {
		xmpp.send(from, 'echo: ' + message);
	});

	xmpp.on('error', function(err) {
		console.error(err);
	});

	xmpp.on('subscribe', function(from) {
	if (from === 'a.friend@gmail.com') {
		xmpp.acceptSubscription(from);
		}
	});

	xmpp.subscribe('your.friend@gmail.com');
	
	xmpp.getRoster();
	
	res.send(1);
}

exports.ltx = function(req,res){
	var ltx = require('ltx');
	p = new ltx.Parser()
    p.on('chat', function(tree) {
        proceed(null, tree);
    })
    p.on('error', function(error) {
        proceed(error);
    })
	
	res.send(1);
}