var http = require('http');
data = 1;
http.createServer(function(req, res) {
    res.writeHead(200,{'Content-Type': 'text/plain'});
    res.end('Witaj,swiecie' + data);
}).listen(3000);
console.log('Server listening on port 3000')
