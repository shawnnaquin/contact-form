const http = require('http');
const multiparty = require('multiparty');
const sgMail = require('@sendgrid/mail');
const Grecaptcha = require('grecaptcha')
const validator = require('validator');
const xssFilters = require('xss-filters');

const getName = (name)=> {
    return validator.trim(
        validator.escape(
            xssFilters.inHTMLData(
                validator.blacklist( name, '\\[\\]')
            )
        )
    );

};

const contact = (fields) => {

  return new Promise((resolve, reject) => {

    let from = 'shawn.naquin@gmail.com';
    let name = fields.name ? fields.name[0] : 'no name';
    let message = fields.message ? fields.message[0] : 'no message';
    let subject = fields.subject ? fields.subject[0] : 'no subject';
    let email = fields.email ? fields.email[0] : 'shawn.naquin@gmail.com';

    sgMail.setApiKey( process.env.SENDGRID_API_KEY );

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

    sgMail.send( msg )
        .then( () => {
          resolve( true );
        } )
        .catch( error => {
          reject( error );
        } );

  });

};

http.createServer( function(request, response) {

    response.setHeader('Content-Type', 'multipart/form-data');
    response.setHeader('Access-Control-Allow-Origin', '*' );
    response.setHeader('Access-Control-Request-Method', 'POST');
    response.setHeader('Access-Control-Allow-Methods', 'POST');
    response.setHeader('Access-Control-Allow-Headers', 'multipart/form-data');
    const client = new Grecaptcha(process.env.RECAPTCHA);

    if( request.method == 'POST') {

        let queryData = '';

        var form = new multiparty.Form('multipart/form-data');

        form.parse(request, function(err, fields, files) {

            if(err) {
                response.writeHead( 400, {'Content-Type': 'application/json'} );
                response.end( JSON.stringify( { "error": "Form could not be parsed at this time.", "type": "parse" } ) );
                return;
            }

            let from = 'shawn.naquin@gmail.com';
            let name = getName( fields.name ? fields.name[0]+'' : 'no name' );
            let message = getName( fields.message ? fields.message[0]+'' : 'no message' );
            let subject = getName( fields.subject ? fields.subject[0]+'' : 'no subject' );
            let email = validator.normalizeEmail( fields.email ? fields.email[0]+'' : 'shawn.naquin@gmail.com' );
            let token = getName( fields.token[0] );

            if ( !validator.isEmail(email) ) {

                response.writeHead( 400, {'Content-Type': 'application/json'} );
                response.end( JSON.stringify( { "error": "Please enter a valid email.", "type": "email" } ) );
                return;
            }

            if ( !token || !token.length ) {
                response.writeHead( 400, {'Content-Type': 'application/json'} );
                response.end( JSON.stringify( { "error": "Did not send reCaptcha token, please check the box.", "type": "recaptcha" } ) );
                return;
            }

            client.verify( fields.token[0] )
                    .then(
                        (accepted) => {
                            if ( accepted ) {

                                // // google accepted us!
                                contact(fields).then( go => {
                                    if(go) {
                                        // sendgrid accepted
                                        response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
                                        response.end();
                                    } else {
                                        response.writeHead( 400, {'Content-Type': 'application/json'} )
                                        response.end( JSON.stringify( { "error": "Message failed to send.", "type": "sendgrid" } ) );
                                    }
                                }).catch((err)=>{
                                    response.writeHead( 400, {'Content-Type': 'application/json'} )
                                    let e = "Message failed to send. Sengrid: " + String(err.response.body.errors[0].message);
                                    let d = { "type": "sendgrid" };
                                    d.error = e;
                                    response.end( JSON.stringify(d) );

                                });

                            } else {
                                response.writeHead( 400, {'Content-Type': 'application/json'});
                                response.end( JSON.stringify( { "error": "reCAPTCHA token denied.", "type": "recaptcha" } ) );
                            }
                        }
                    )
                    .catch((err) =>  {
                        response.writeHead( 400, {'Content-Type': 'application/json'});
                        response.end( JSON.stringify( { "error": "reCaptcha token denied, please re-check the box.", "type": "recaptcha" } ) );
                    })

        });

        request.on('data', function(data) {

            queryData += data;

            if( queryData.length > 1e6 ) {
                // too long;
                queryData = "";
                response.writeHead( 403, {'Content-Type': 'application/json'});
                response.end( JSON.stringify( { "error": "Too much data!", "type": "data" } ) );
            }

        });


    } else {

        response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        response.end();

    }

}).listen( process.env.PORT || 80 );
