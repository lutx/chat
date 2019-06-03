
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

function send404(response) {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.write('Blad 404: plik nie zostal znalezionu');
    response.end();
}

function sendFile(response, filePath, fileContents) {
    response.writeHead(200, { "content-type": mime.lookup(path.basename(filePath)) });
    response.end(fileContents);
}

function serveStatic(response, cache, absPath) { //Sprawdzenie, czy plik jest buforowany w pamięci.
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]); //Udostępnienie pliku z pamięci.
    } else {
        fs.exists(absPath, function (exists) { //Sprawdzenie, czy plik istnieje.
            if (exists) {
                fs.readFile(absPath, function (err, data) { //Odczyt pliku z dysku.
                    if (err) {
                        send404(response);
                    } else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data); //Udostępnienie pliku odczytanego z dysku.
                    }
                });
            } else {
                send404(response); //Wysłanie odpowiedzi HTTP 404.
            }
        });
    }
}

var server = http.createServer(function (request, response) {
    var filePath = false;
    if (request.url == '/') {
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath);
});

server.listen(3000, function () {
    console.log("Serwer nasłuchuje na porcie 3000.");
});