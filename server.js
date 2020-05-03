var http = require('http');
var url = require('url');
const querystring = require('querystring')


function start(route , handle) {
    function onRequest(request , response){
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received");
        const requestUrl = url.parse(request.url)
        const params = querystring.decode(requestUrl.query)
        console.log(typeof params)
        route(handle, pathname, request, response, params)
    }

    http.createServer(onRequest).listen(81);
    console.log("server has start");
}

exports.start = start ;

