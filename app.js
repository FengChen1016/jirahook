var http = require("http");
var https = require("https");
//var querystring = require('querystring');
var config = require("./config");

// get heroku listening port
var port = process.env.PORT;

http.createServer(function (req, res) {
	if (req.method == 'GET') {
		console.log("request url: " + req.url);
        // TODO render HTML page with all unresolved whitelist ticket

		res.end();
	} else if (req.method == 'POST' && req.url.indexOf("/whitelisthook/" > 0)) {
		console.log("request url: " + req.url + "  method: " + req.method);
		
		processPost(req, res, function() {
            // console.log(req.rawbody);  // Use req.body here
            logJIRATicketInfo(req);

            // perform validation
            validateJIRATicket(req.body.issue, function(options) {
            	// TODO handle invalid whitelist ticket.  e.g. add comments or send email etc.
            	console.log("options: " + JSON.stringify(options));
            	
                var jira_host = config.jira_host;
                var api_path = config.rest_api_path;
                var comment_path = "issue/" + options.key + "/comment";
                console.log("rest url to add comments: " + jira_host + api_path + comment_path);

                var postBody = {
                    body: options.comments
                }

                var postData = JSON.stringify(postBody);

                var postOptions = {
                    hostname: jira_host,
                    port: 443,
                    path: api_path + comment_path,
                    method: 'POST',
                    headers: {
                        'Authorization': config.credential.authorization,
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length
                    }
                };

                // post request to add comments
                var req = https.request(postOptions, function(res) {
                    console.log('Response STATUS: ' + res.statusCode);
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        console.log("body: " + chunk);
                    });
                }).on('error', function(e) {
                    console.log(e.message);
                });
                req.write(postData);
                req.end();

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
    //console.log("attachment(first) link: " + fields.attachment[0].self + 
    //	"  file name: " + fields.attachment[0].filename);
}

var DOCUMENTS_REQUIRED  =  "Please attach required documents at https://confluence.successfactors.com/pages/viewpage.action?pageId=172926581";
var DESC_TAGS_REQUIRED  =  "Please provide longdescription and tags. e.g...";
var DESCRIPTION_EMPTY   =  "<longdescription> cannot be empty. Please provide longdescription.";
var EMPTY_TAGCOLLECTION =  "Please provide tags.";

function validateJIRATicket(issue, callback) {
	var fields = issue.fields;
	var isValid = true;
	var comment = "some comment goes here...";
	console.log("validating whitelist ticket...");
	// validation goes here
	// 1. check if longdescription and tags provided in summary and description

	// 2. check if documents attached for public entities

	// 3. optional: check document content? property names and types?

    if (isValid) {  //!isValid
    	var options = {
            key: issue.key,
    		comments: comment   //'please attach required documents'
    	}
    	callback(options);
    }
}
