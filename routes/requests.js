// Taken in part from https://github.mit.edu/6170-fa15/6170-Notes-Demo
var express = require('express');
var router = express.Router();
var utils = require('../utils/utils');

var Schema = require('../models/schema');
var User = Schema.User;
var Request = Schema.Request;
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
/*
var requireOwnership = function(req, res, next) {
	if (!(req.currentUser.username === req.request.creator)) {
		utils.sendErrResponse(res, 404, 'Resource not found.');
	} else {
		next();
	}
};*/

/*
	For create and edit requests, require that the request body
	contains a 'description' field. Send error code 400 if not.
*/
var requireDescription = function(req, res, next) {
	if (!req.body.desc) {
		utils.sendErrResponse(res, 400, 'Description required in request.');
	} else {
		next();
	}
};



// Register the middleware handlers above.
router.all('*', requireAuthentication);
//router.delete('/:request', requireOwnership);
router.post('/create', requireDescription);

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
	Request.getAllRequests(function(err, requests) {
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res, { requests: requests });
		}
	});
});

/*
	GET /requests/candidates
	Params:
		- request_id: id of the request being queried
	Response:
		- success: true if the server succeeded in getting the request's candidates
		- candidates: on success, an object with a single field 'candidates', which contains a list of the
		request's candidates
		- err: on failure, an error message
*/
router.get('/candidates', function(req, res) {
	Request.getRequestById(request_id, function(err, request) {
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res, { candidates: request.candidates });
		}
	});
});

/*
	GET /requests/myRequests
	No request parameters
	Response:
		- success: true if the server succeeded in getting the user's requests
		- candidates: on success, an object with a single field 'requests', which contains a list of the
		user's requests
		- err: on failure, an error message
*/
router.get('/myRequests', function(req, res) {
	User.getUserData(req.currentUser.username, function(err, data) {

		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {

			utils.sendSuccessResponse(res, { requests: data.myRequests });

			/*
			res.render('requests_active', {
				userProfile: req.currentUser,
				requests: data.myRequests
			});*/
		}
	});
});

/*
	GET /requests/takenRequests
	No request parameters
	Response:
		- success: true if the server succeeded in getting the user's candidates
		- candidates: on success, an object with a single field 'requests', which contains a list of the
		user's requests
		- err: on failure, an error message
*/
router.get('/takenRequests', function(req, res) {
	User.getUserRequests(req.currentUser.username, function(err, requests) {
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res, { requests: takenRequests });
		}
	});
});


// Post for requests? Sign up to take an open request
/*
	POST /requests/addCandidate
	Signs the current user up to take the request specified by the requestID.
	Params:
		- request_id - unique id of the request
*/
router.post('/addCandidate',function(req,res){
	
	Request.addCandidate(req.body.request_id, User, req.currentUser.username, function(err){
			if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res);
		}
	});
});

/*
	POST /requests/accept

	Params:
		- request_id - unique id of the request
		- username - username of the candidate to accept
*/
router.post('/acceptCandidate',function(req,res){
	Request.acceptCandidate(req.body.request_id, User, req.body.username, function(err){
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res);
		}
	});
});

/*
	POST /requests/create
	Params:
		No params.
*/
// json with title description - date created - expiration date
router.post('/create', function(req,res){
	Request.createRequest(User, req.currentUser.username, {'title': req.body.title, 'dateCreated': new Date(), 'description': req.body.desc, 'expirationDate':req.body.expires},
		function(err){
			 if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res);
		}
		});
});

/*
  POST /requests/startRequest
  Request parameters:
    - request_id: the unique ID of the request within the logged in user's request collection

  Response:
    - success: true if the server succeeded in initializing the request
    - err: on failure, an error message
*/
// Requires Ownership (middleware)
router.post('/startRequest', function(req,res) {
	console.log("start request called"); //debug
  Request.startRequest(req.body.request_id,
    function(err){
     if (err) {
      utils.sendErrResponse(res, 500, 'An unknown error occurred.');
    } else {
      utils.sendSuccessResponse(res);
    }
  });
});

/*
  POST /requests/completeRequest
  Request parameters:
    - request_id: the unique ID of the request within the logged in user's request collection

  Response:
    - success: true if the server succeeded in completing the request
    - err: on failure, an error message
*/
// Requires Ownership (middleware)
router.post('/completeRequest', function(req,res){
  Request.completeRequest(req.body.request_id,
    function(err){
     if (err) {
      utils.sendErrResponse(res, 500, 'An unknown error occurred.');
    } else {
      utils.sendSuccessResponse(res);
    }
  });
});


/*
	DELETE /requests/:request
	Request parameters:
		- request_id: the unique ID of the request within the logged in user's request collection

	Response:
		- success: true if the server succeeded in deleting the user's request
		- err: on failure, an error message
*/
// Requires Ownership (middleware)
router.delete('/:request', function(req, res) {
	User.removeRequest( 
		req.body.request_id, 
		function(err) {
			if (err) {
				utils.sendErrResponse(res, 500, 'An unknown error occurred.');
			} else {
				utils.sendSuccessResponse(res);
			}
	});
});

module.exports = router;
