/*
* Primary file for the API
* ES6
*
*/

//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');


//Instantiating the HTTP server
const httpServer = http.createServer((req, res)=>{
    unifiedServer(req, res);
});

//Start the HTTP server and have it listen on http port
httpServer.listen(config.httpPort, ()=>{
    console.log('HTTP Server is listening on port', config.httpPort , config.envName);
});

//Instantiating the HTTPS server
const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req, res)=>{
    unifiedServer(req, res);
});

//Start the HTTPS server and have it listen on https port
httpsServer.listen(config.httpsPort, ()=>{
    console.log('HTTPS Server is listening on port', config.httpsPort , config.envName);
});

//All the server logics for both http and https servers
const unifiedServer = (req, res) =>{
    //Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);//this true will call querystring module internally to extract the query strings

    //Get the path from the URL
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');

    //Get the HTTP method
    const method = req.method.toLowerCase();

    //Get the query string as an object
    const queryStringObject = parsedUrl.query;

    //Get the headers as an object
    const headers = req.headers;

    //Nodejs streaming a payload
    //Get the payload, if there is any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    // When a request comes, it emmits an event called data and it's returning encoded data.
    req.on('data', (data)=>{
        buffer += decoder.write(data);
    });

    //For all requests, this end event is going to call
    req.on('end', ()=>{
        buffer += decoder.end();

        //Choose the handler this request should go to
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound; 

        //Construct the data object to send to the handler
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        //Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload)=>{
            //Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //Use the payload called back by handler or default to an empty object - {}
            payload = typeof(payload) == 'object' ? payload : {};

            //Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            //Return the response
            res.setHeader('Content-Type', 'application/json');
            //For CORS Handling +++++++++
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
            //++++++++++++++++++++++++++++

            res.writeHead(statusCode);
            res.end(payloadString);

            //Log the requested path
            console.log('Request received on path: ' + trimmedPath + ' with method: '+ method);
            console.log('Query string:',JSON.stringify(queryStringObject));
            console.log('Request received with this headers:',JSON.stringify(headers));
            console.log('Request received with this payload:',buffer);
            console.log('++++++++++++++++++++++++++');
            console.log('Returning the response:', statusCode, payloadString);
        });
    });
};

//Defining the handlers
const handlers = {};

//ping handler
handlers.ping = (data,cb) =>{
    //Callback a http status code and a payload object
    cb(200);
};

//hello handler
handlers.hello = (data,cb) =>{
    //Callback a http status code and a payload object
    cb(200, {'result': 'Hello World!'});
};

//not found handler
handlers.notFound = (data,cb) =>{
    cb(404);
};

//Defining a request router
const router = {
    'ping' : handlers.ping,
    'hello' : handlers.hello,
};

//Note-
//To create openssl need to execute the following command-
//Install openssl
//openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem