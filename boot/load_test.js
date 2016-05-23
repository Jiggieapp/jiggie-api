var wrk = require('wrk');

var conns = 1;
var results = [];

function benchmark() {
  if (conns === 100) {
    return console.log(results);
  }
  conns++;
  wrk({
    threads: 10,
    connections: conns,
    duration: '10s',
    printLatency: true,
    url: 'https://127.0.0.1:4300/app/v3/partyfeed/list/1117131014972812/both'
  }, function(err, out) {
     results.push(out);
     benchmark();
  });
}
benchmark();