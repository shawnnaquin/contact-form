var http = require('http');
var querystring = require('querystring');
var multiparty = require('multiparty');
function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if( request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            // request.post = querystring.parse(queryData);
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}

http.createServer( function(request, response) {

    response.setHeader('Access-Control-Allow-Origin', '*' );
    response.setHeader('Access-Control-Request-Method', 'POST');
    response.setHeader('Access-Control-Allow-Methods', 'POST');
    response.setHeader('Access-Control-Allow-Headers', 'multipart/form-data');

    if( request.method == 'POST') {
        processPost(request, response, function() {
            var form = new multiparty.Form();
            console.log(request);
            console.log(request.body);
            console.log(request.data);
            // form.parse( request.body, function(err, fields, files) {
            //   res.writeHead(200, {'content-type': 'text/plain'});
            //   res.write('received upload:\n\n');
            //   res.end(util.inspect({fields: fields, files: files}));
            // });

        });
    } else {
        response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        response.end();
    }

}).listen( process.env.PORT || 80 );

// var helper = require('sendgrid').mail;
// var from_email = new helper.Email('test@example.com');
// var to_email = new helper.Email('test@example.com');
// var subject = 'Hello World from the SendGrid Node.js Library!';
// var content = new helper.Content('text/plain', 'Hello, Email!');
// var mail = new helper.Mail(from_email, subject, to_email, content);

// var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
// var request = sg.emptyRequest({
//   method: 'POST',
//   path: '/v3/mail/send',
//   body: mail.toJSON(),
// });

// sg.API(request, function(error, response) {
//   console.log(response.statusCode);
//   console.log(response.body);
//   console.log(response.headers);
// });