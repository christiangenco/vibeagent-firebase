const {onRequest} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

exports.helloWorld = onRequest(
  {
    cors: true,
    invoker: 'public'
  },
  (request, response) => {
    const result = {
      queryParams: request.query,
      body: request.body,
      method: request.method,
      headers: request.headers,
      url: request.url
    };
    
    response.status(200).json(result);
  }
);