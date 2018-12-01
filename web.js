var http = require('http');
var multiparty = require('multiparty');
const sgMail = require('@sendgrid/mail');
const Grecaptcha = require('grecaptcha')
const client = new Grecaptcha( process.env.RECAPTCHA );

function destroyConnection( error ) {
    response.writeHead( error, {'Content-Type': 'text/plain'}).end();
    request.connection.destroy();
}

function verifyCaptcha(fields,token) {

    if ( await client.verify( token ) ) {
        contact(fields);
    }
    else {
        destroyConnection( 429 );
    }

}


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
      content: [
        // {
        //   type: 'text/plain',
        //   value: name + '\n' + message,
        // },
        {
          type: 'text/html',
          value: '<h3>'+name+'</h3><p>'+message+'</p>',
        }
      ]
    };

    sgMail.send(msg)
    .then(() => {

      response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
      response.end();

    })
    .catch(error => {
        // console.error(error.toString());
        // const {message, code, response} = error;
        // const {headers, body} = response;
        destroyConnection( 429 );

    });

}

http.createServer( function(request, response) {

    response.setHeader('Content-Type', 'multipart/form-data');
    response.setHeader('Access-Control-Allow-Origin', '*' );
    response.setHeader('Access-Control-Request-Method', 'POST');
    response.setHeader('Access-Control-Allow-Methods', 'POST');
    response.setHeader('Access-Control-Allow-Headers', 'multipart/form-data');

    if( request.method == 'POST') {

        let queryData = '';
        let token = ''; // get token

        if ( !token ) {
            destroyConnection( 429 );
        }

        request.on('data', function(data) {

            queryData += data;

            if( queryData.length > 1e6 ) {

                queryData = "";
                destroyConnection( 419 );

            } else {

                request.on('end', ()=> {

                    var form = new multiparty.Form('multipart/form-data');

                    form.parse(request, function(err, fields, files) {
                        verifyCaptcha(fields,token);
                    });

                });

            }

        });

    } else {

        response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        response.end();

    }

}).listen( process.env.PORT || 80 );
