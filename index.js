var server = require("./server");
var router = require("./router");
var requestHandler = require("./requestHandler");
//var db = require("./mongodb");

var handle = {};
handle['PUT/dataService']= requestHandler.addEmployee;
handle['GET/dataService']= requestHandler.getData;
handle['POST/dataService']= requestHandler.editData;
handle['DELETE/dataService']= requestHandler.deleteEmployee;
handle['GET/getAllEmployee']= requestHandler.getAllEmployee;

server.start(router.route , handle);
