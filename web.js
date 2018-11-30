var http = require('http');
var multiparty = require('multiparty');
const sgMail = require('@sendgrid/mail');

function contact(fields) {

    let from = 'shawn.naquin@gmail.com';
    let name = fields.name ? fields.name[0] : 'no name';
    let message = fields.message ? fields.message[0] : 'no message';
    let subject = fields.subject ? fields.subject[0] : 'no subject';
    let email = fields.email ? fields.email[0] : 'shawn.naquin@gmail.com';

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: from,
      from: email,
      subject: subject,
      text: name + ':\n' + message,
      html: '',
    };

    sgMail.send(msg);
}

http.createServer( function(request, response) {

    response.setHeader('Content-Type', 'multipart/form-data');
    response.setHeader('Access-Control-Allow-Origin', '*' );
    response.setHeader('Access-Control-Request-Method', 'POST');
    response.setHeader('Access-Control-Allow-Methods', 'POST');
    response.setHeader('Access-Control-Allow-Headers', 'multipart/form-data');

    if( request.method == 'POST') {
        var form = new multiparty.Form('multipart/form-data');
        var queryData = "";
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });
        form.parse(request, function(err, fields, files) {
            contact(fields);
            response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            response.end();
        });

    } else {
        response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        response.end();
    }

}).listen( process.env.PORT || 80 );
