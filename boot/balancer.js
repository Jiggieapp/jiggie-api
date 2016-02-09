var seaport = require('seaport');
var ports = seaport.connect(9090);
var request = require('request');

ports.get('web@1.2.1', function (ps) {
    var u = 'http://' + ps[0].host + ':' + ps[0].port;
    console.log(u);
    request(u).pipe(process.stdout);
});

ports.get('web@1.2.2', function (ps) {
    var u = 'http://' + ps[0].host + ':' + ps[0].port;
    console.log(u);
    request(u).pipe(process.stdout);
});