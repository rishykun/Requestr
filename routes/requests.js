// Taken in part from https://github.mit.edu/6170-fa15/6170-Notes-Demo
var express = require('express');
var router = express.Router();
var utils = require('../utils/utils');

var User = require('../models/schema').User;
var Request = require('../models/schema').Request;

var url = require('url');
var querystring = require('querystring');
var http = require('http');
var request = require('request');
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
//router.all('*', requireAuthentication);
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

			utils.sendSuccessResponse(res, { currentUser: req.currentUser.username, requests: data.myRequests });

			/*
			res.render('requests_active', {
				userProfile: req.currentUser,
				requests: data.myRequests
			});*/
		}
	});
});

router.get('/myRequests/:filter', function(req, res) {
	User.getRequestsByStatus(req.currentUser.username, req.params.filter, function(err, data) {

		//console.log("data received: ", data); //debug

		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res, { requests: data });

			/*
			res.render('requests_active', {
				userProfile: req.currentUser,
				requests: data.myRequests
			});*/
		}
	});
});

/*
	GET /requests/myAcceptedRequests
	No request parameters
	Response:
		- success: true if the server succeeded in getting the user's requests
		- candidates: on success, an object with a single field 'requests', which contains a list of the
		user's accepted requests
		- err: on failure, an error message
*/
router.get('/myAcceptedRequests', function(req, res) {
	User.getUserData(req.currentUser.username, function(err, data) {

		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {

			utils.sendSuccessResponse(res, { currentUser: req.currentUser.username, requests: data.requestsTaken });

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
	User.getUserData(req.currentUser.username, function(err, data) {
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res, { requests: data.takenRequests });
		}
	});
});


// TODO: Declare at top - Clean up this code
// TODO: Attach oauth_token to req
//var oauth_token = null;

var pendingPayments = {};

// MAKE SURE THE SAME PAYMENT CANT BE MADE TWICE - IF NOT AUTHENTICATED TAKE PAYMENT OFF PENDING
// Dictionary? - and then keep request id and compare request id so cant add payment for same request? dunno
router.get('/pay', function(req, res) {
	console.log("In authentication route.");
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	if(query.error){
		// Redirect to fail page
		pendingPayments[req.currentUser.username] = null;
		res.redirect('/');
	}
	else{
	var oauth_token = query.access_token;
	var pay_data = pendingPayments[req.currentUser.username];
	if(pay_data){
		var post_data = pay_data.post_data;
	}
	else {
		// Redirect to fail page
		res.redirect('/');
	}
	post_data.access_token = oauth_token;
	request.post('https://api.venmo.com/v1/payments', {form: post_data}, function(e, r, venmo_receipt){
        // parsing the returned JSON string into an object
        var venmo_receipt = JSON.parse(venmo_receipt);
        console.log(venmo_receipt);
        if(venmo_receipt.error)
        {
        	// Redirect to fail page
        	pendingPayments[req.currentUser.username] = null;
        	res.redirect('/');
        }
        else
        {
        	Request.payHelper(pay_data.request_id,pay_data.user_id, function(err)
        	{
        		console.log(err);
        		if(err){
        			// Redirect to fail page
        			pendingPayments[req.currentUser.username] = null;
        			res.redirect('/');
        		}
        		else {
        			// Redirect to success page
        			res.redirect('/');
        		}
        	});
			//res.redirect('/');
        }

    });
	// if success redirect to success page
	// if fail redirect to fail page
		//res.redirect('/');
	}
});

router.post('/:request/pay/:userid', function (req,res){
	
	Request.getRequestById(req.params.request, function(err, request){
	
		if(err) utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		else{
			var pay_data = {
				'request_id' : req.params.request,
				'user_id' :req.params.userid,
				'post_data':{
		      //'access_token' : oauth_token,
		      'email': req.body.venmo_email,
		      'note': 'Requestr payment 2.',
		       'amount' : request.reward
		   }
		  	};
		  	pendingPayments[req.currentUser.username] = pay_data;
		  }
		});
});

// TODO: if logged out clear authentication token
// /:request
/*router.post('/:request/pay/:userid', function(req,res){
	console.log(oauth_token);
	console.log(req.params.request);
//Request.getRequestById(req.params.request, function(err, request){
	
//if(err) utils.sendErrResponse(res, 500, 'An unknown error occurred.');
//else{
	//console.log(request.reward);
	//console.log("Venmo Email: " + req.body.venmo_email);
	/*var post_data = {
      'access_token' : oauth_token,
      'email': req.body.venmo_email,
      'note': 'Requestr payment.',
       'amount' : request.reward
  	};

  	var post_data = {
      'access_token' : oauth_token,
      'email': 'rrrahman@mit.edu',
      'note': 'Requestr payment.',
       'amount': 0.01
  	};
	 request.post('https://api.venmo.com/v1/payments', {form: post_data}, function(e, r, venmo_receipt){
        console.log("In venmo return");
        // parsing the returned JSON string into an object
        var venmo_receipt = JSON.parse(venmo_receipt);
        console.log(venmo_receipt);
        if(venmo_receipt.error)
        {
        	utils.sendErrResponse(res, 500, venmo_receipt.error.message)
        }
        else
        {
        	Request.payHelper(req.params.request,req.params.userid, function(err)
        	{
        		if(err){
        			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
        		}
        		else {
        			utils.sendSuccessResponse(res, 'Request has been paid.');
        		}
        	});
	 		utils.sendSuccessResponse(res, 'Request has been paid.');
        	
        }

    });
	//}
	//});
});*/


/*
	POST /requests/create
	Params:
		No params.
*/
// json with title description - date created - expiration date
router.post('/create', function(req,res){
	Request.createRequest(User, req.currentUser.username, {'title': req.body.title, 'dateCreated': new Date(), 'description': req.body.desc, 'expirationDate':req.body.expires, 'reward': req.body.reward, 'tags': req.body.tags },
		function(err){
			 if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res);
		}
		});
});

/*
	GET /requests/search/tags
	Params:
		tags - string array of the tags to search for
	Response:
		- success: true if the server succeeded in getting the user's requests
		- candidates: on success, an object with a single field 'requests', which contains a list of the
		user's requests
		- err: on failure, an error message
*/
router.post('/search', function(req, res) {

	Request.getRequestByFilter(null, req.body.keywords, req.body.tags, function(err, data) {

		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {

			utils.sendSuccessResponse(res, { requests: data});
			/*
			res.render('requests_active', {
				userProfile: req.currentUser,
				requests: data.myRequests
			});*/
		}
	});
});

/*
	GET /requests/:request
	Gets a specific request
	Response:
		- success: true if the server succeeded in getting the request
		- request: on success, an object representing this request
		- err: on failure, an error message
*/
router.get('/:request', function (req, res) {
	var refuseRender = req.param('refuseRender');

	Request.getRequestById(req.params.request, function (err, data) {
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			if (refuseRender == 'true') {
				utils.sendSuccessResponse(res, {
					userProfile: req.currentUser, 
					request: data,
					colors: {"Open": "mediumseagreen", "In progress": "lightcoral", "Completed": "lightskyblue"} //color code
				});
			} else {
				res.render('request', {
					userProfile: req.currentUser,
					request: data,
					colors: {"Open": "mediumseagreen", "In progress": "lightcoral", "Completed": "lightskyblue"} //color code
				});
			}
		}
	});
});

/*
	"START REQUEST" "COMPLETE REQUEST"
  PUT /requests/:request
  Request parameters:
	- updateType: dictates what sort of modification we want to perform on the specified request (i.e. start or complete it)

  Response:
	- success: true if the server succeeded in initializing or completing the request
	- err: on failure, an error message
*/
// Requires Ownership (middleware)
router.put('/:request', function(req,res) {
	console.log("START REQUEST BACKEND"); //debug
	if (req.body.updateType == "start") {
		Request.startRequest(req.params.request,
		function(err){
		 if (err) {
		  utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
		  utils.sendSuccessResponse(res);
		}
	  });
	} else if (req.body.updateType == "complete") {
		Request.completeRequest(req.params.request,
		function(err){
		 if (err) {
		  utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
		  utils.sendSuccessResponse(res);
		}
	  });
	}
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

//DEVELOPER NOTE: DOES THIS EVEN GET CALLED ANYWHERE?
/*
	GET /requests/:request/candidates
	Response:
		- success: true if the server succeeded in getting the request's candidates
		- candidates: on success, an object with a single field 'candidates', which contains a list of the
		request's candidates
		- err: on failure, an error message
*/
router.get('/:request/candidates', function(req, res) {
	Request.getRequestById(req.params.request, function(err, request) {
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res, { candidates: request.candidates });
		}
	});
});

/*
	"ADD CANDIDATE"
	POST /requests/:request/candidates
	Response:
		- success: true if the server succeeded in getting the request's candidates
		- candidates: on success, an object with a single field 'candidates', which contains a list of the
		request's candidates
		- err: on failure, an error message
*/
router.post('/:request/candidates', function(req, res) {
	Request.addCandidate(req.params.request, User, req.currentUser.username, function(err){
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res);
		}
	});
});

/*
	"ACCEPT CANDIDATE"
	PUT /requests/:request/candidates/:candidate
	Adds or Accepts the specified candidate for the specified request
*/
router.put('/:request/candidates/:candidate', function(req,res){
	Request.acceptCandidate(req.params.request, User, req.params.candidate, function(err){
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res);
		}
	});
});


/*
	"ADD COMMENT"
	POST /requests/:request/comments
	Request parameters:
		- comment: the comment string to append as a comment to the specified request

	Response:
		- success: true if the server succeeded in initializing the request
		- err: on failure, an error message
*/
router.post('/:request/comments', function (req, res) {
	Request.addComment(req.params.request, User, req.currentUser, req.body.comment, function(err, comment) {
		if (err) {
			utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		} else {
			utils.sendSuccessResponse(res, comment);
		}
	});
});

module.exports = router;
