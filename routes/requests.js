// Taken in part from https://github.mit.edu/6170-fa15/6170-Notes-Demo
var express = require('express');
var router = express.Router();
var utils = require('../utils/utils');

var Schema= require('../models/requestrSchema');

/*
  Require authentication on ALL access to /requests/*
  Clients who are not logged in will receive a 403 error code.
*/
var requireAuthentication = function(req, res, next) {
  if (!req.currentUser) {
    utils.sendErrResponse(res, 403, 'Must be logged in to use this feature.');
  } else {
    next();
  }
};

/*
  Require ownership whenever deleting a request.
  This means that the client accessing the resource must be logged in
  as the user that originally created the request. Clients who are not owners 
  of this particular resource will receive a 404.

*/
var requireOwnership = function(req, res, next) {
  if (!(req.currentUser.username === req.request.creator)) {
    utils.sendErrResponse(res, 404, 'Resource not found.');
  } else {
    next();
  }
};



/*
  Grab a fweet whenever one is referenced with an ID in the
  request path (any routes defined with :fweet as a paramter).
*/
router.param('request', function(req, res, next, requestId) {
  User.getRequest(req.currentUser.username, fweetId, function(err, fweet) {
    if (request) {
      req.request = request;
      next();
    } else {
      utils.sendErrResponse(res, 404, 'Resource not found.');
    }
  });
});

// Register the middleware handlers above.
router.all('*', requireAuthentication);
router.delete('/:fweet', requireOwnership);


/*
  GET /requests
  No request parameters
  Response:
    - success: true if the server succeeded in getting the user's requests
    - content: on success, an object with a single field 'requests', which contains a list of the
    user's requests
    - err: on failure, an error message
*/
router.get('/', function(req, res) {
  User.getFweets(req.currentUser.username, function(err, requests) {
    if (err) {
      utils.sendErrResponse(res, 500, 'An unknown error occurred.');
    } else {
      utils.sendSuccessResponse(res, { requests: requests });
    }
  });
});


/*
  GET /requests/:request
  Request parameters:
    - request: the unique ID of the request 
  Response:
    - success: true if the server succeeded in getting the specific request
    - content: on success, the fweet object with ID equal to the fweet referenced in the URL
    - err: on failure, an error message
*/
router.get('/:request', function(req, res) {
  utils.sendSuccessResponse(res, req.request);
});

// Post for requests? Sign up to take an open request



/*
  DELETE /requests/:request
  Request parameters:
    - request ID: the unique ID of the request within the logged in user's request collection
  Response:
    - success: true if the server succeeded in deleting the user's request
    - err: on failure, an error message
*/
router.delete('/:request', function(req, res) {
  User.removeRequest(
    req.currentUser.username, 
    req.request._id, 
    function(err) {
      if (err) {
        utils.sendErrResponse(res, 500, 'An unknown error occurred.');
      } else {
        utils.sendSuccessResponse(res);
      }
  });
});

module.exports = router;
