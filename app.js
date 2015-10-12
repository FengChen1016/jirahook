var http = require("http");
//var querystring = require('querystring');
var config = require("./config");

// get heroku listening port
var port = process.env.PORT;

http.createServer(function (req, res) {
	if (req.method == 'GET') {
		console.log("request url: " + req.url);
		res.end();
	} else if (req.method == 'POST') {
		console.log("request url: " + req.url + "  method: " + req.method);
		
		processPost(req, res, function() {
            // console.log(req.rawbody);  // Use req.body here
            logJIRATicketInfo(req);

            // perform validation
            validateJIRATicket(req.body.issue, function(options) {
            	// TODO handle invalid whitelist ticket.  e.g. add comments or send email etc.
            	console.log("options.comments: " + options.comments);
            	
            });

            res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            res.end();
        });

	} else {
		res.end();
	}

}).listen(port);  //1337 for local

console.log('Server running at localhost(http://127.0.0.1:1337/)');

function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
        	request.rawbody = queryData;
            request.body = JSON.parse(queryData);  // string -> object
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}

function logJIRATicketInfo(request) {
	var issue = request.body.issue;
    var fields = issue.fields;
    console.log("JIRA ticket: " + issue.key);
    console.log("creator: " + fields.creator.name + "<" + fields.creator.emailAddress + ">");
    console.log("project: " + fields.project.name);
    console.log("component(first): " + fields.components[0].name);
    console.log("summary: " + fields.summary);
    console.log("description: " + fields.description);
    console.log("attachment(first) link: " + fields.attachment[0].self + 
    	"  file name: " + fields.attachment[0].filename);
}

function validateJIRATicket(issue, callback) {
	var fields = issue.fields;
	var isValid = true;
	var comment = "";
	console.log("validating whitelist ticket...");
	// validation goes here

	// 1. check if documents attached (public?)

	// 2. check longdescription and tags provided

	// 3. optional: check document content? property names and types?


	var options = {
		comments: comment   //'please attach required documents'
	}
	callback(options);
}
