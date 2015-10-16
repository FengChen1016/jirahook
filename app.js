//var http = require("http");
var https = require("https");
var config = require("./config");
var express = require("express");
var app = express();

app.use(express.static(__dirname));
app.use(express.static('view'));

// get heroku listening port
var port = process.env.PORT || 1337;    // 1337 for local


app.get('/', function(req, res) {
    res.redirect('/index.html');
});

app.get('/api/openticket', function(req, res) {  // list all open whitelist ticket
    getWhitelistTickets(function(content) {
        var contentObj = JSON.parse(content);
        var resJsonArray = filterJsonArray(contentObj.issues);
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resJsonArray);
    });
});

app.post('/whitelisthook/*', function(req, res) {
    console.log("get into whitelisthook function")
    processPost(req, res, function() {
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
            var postReq = https.request(postOptions, function(res) {
                console.log('Response STATUS: ' + res.statusCode);
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    //console.log("body: " + chunk);
                });
            }).on('error', function(e) {
                console.log(e.message);
            });
            postReq.write(postData);
            postReq.end();
        });

        //res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        res.end();
    });
});

var server = app.listen(port, function() {
    // var host = server.address().address;
    console.log('Server start up!!!');
});

console.log('Server running at localhost(http://127.0.0.1:1337/)');

function getWhitelistTickets(callback) {
    console.log("GET request to fetch whitelist from JIRA...");
    var getOptions = {
        hostname: config.jira_host,
        port: 443,
        path: config.rest_api_path + 'search?jql=project+%3D+HAC+AND+component+%3D+whitelist',
        method: 'GET',
        headers: {
            'Authorization': config.credential.authorization,
            'Content-Type': 'application/json'
        }
    };

    var getReq = https.get(getOptions, function(res) {
        var size = 0;
        var chunks = [];
        var content = "";

        res.on('data', function(chunk) {
            chunks.push(chunk);
        });

        res.on('end', function() {
            content = chunks.join("");
            callback(content);
        });

    }).on('error', function(e) {
        console.log(e.message);
    });
}

function filterJsonArray(rawArray) {
    var jsonArray = [];
    for (var i = 0; i < rawArray.length; i++) {
        var issue = rawArray[i];
        var entry = {
            key: issue.key,
            href: "https://" + config.jira_host + "/browse/" + issue.key,
            summary: issue.fields.summary,
            reporter: issue.fields.reporter.name,
            assignee: (issue.fields.assignee && issue.fields.assignee.name) || "unassigned",
            status: issue.fields.status.name,
            created: issue.fields.created,
            updated: issue.fields.updated
        };
        jsonArray.push(entry);
    }
    return jsonArray;
}

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

var DOCUMENTS_REQUIRED  =  "Please attach required documents: https://confluence.successfactors.com/pages/viewpage.action?pageId=172926581";
var DESC_TAGS_REQUIRED  =  "Please provide longdescription and tags.";
var DESCRIPTION_EMPTY   =  "<longdescription> cannot be empty. Please provide longdescription.";
var EMPTY_TAGCOLLECTION =  "Please provide tags.";

function validateJIRATicket(issue, callback) {
	var fields = issue.fields;
	var isValid = true;
	var newComment = "";
	console.log("validating whitelist ticket...");
	// 1. check if longdescription and tags provided in description or comments
    var comments = issue.comment && issue.comment.comments;  // comments array
    if (fields.description.indexOf('<documentation>') < 0) {
        // check comments
        var hasDocTag = false;
        if (comments) {
            for (var i = 0; i < comments.length; i++) {
                if (comments[i].body.indexOf('<documentation>') > 0) {
                    hasDocTag = true;
                    break;
                }
            }
        }
        if (!hasDocTag) {
            isValid = false;
            newComment = newComment + "--" + DESC_TAGS_REQUIRED + "\n";
        }
    }
	// 2. check if documents attached for public entities
    if (fields.description.indexOf("public") > 0) {
        if (!fields.attachment || fields.attachment.length == 0) {
            isValid = false;
            newComment = newComment + "--" + DOCUMENTS_REQUIRED + "\n";
        }
    }
	// 3. TODO: check document content? property names and types?

    if (!isValid) {  
    	var options = {
            key: issue.key,
    		comments: newComment   //'please attach required documents'
    	}
    	callback(options);
    }
}
