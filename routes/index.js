var express = require('express');
var router = express.Router();
var Schema = require('../models/schema');

/*
	GET home page.

	GET /
	No request parameters
	Response:
		- appropriately rendered homepage (index.ejs) depending on whether the user is logged in or not
*/
router.get('/', function(req, res) {
	//check if logged in and render with the appropriate value
	if (req.currentUser) {

		console.log("user logged in"); //debug

		Schema.Request.getAllRequests(function(err, requests) {
		    if (err) {
		      utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		    } else {

		    	requests.forEach(function(request) {
		    		request.candidates = request.candidates.map(function (ele) {
		    			return ele.username;
			    	});

			    	request.helpers = request.helpers.map(function (ele) {
			    		return ele.username;
			    	});
		    	});

		    	res.render('index', {
					userProfile: req.currentUser,
					requests: requests
				});
		    }
		 });

		

	}
	//if not logged in, render with no userProfile data
	else {
		res.render('index', {
			userProfile: undefined
		});
	}
});

module.exports = router;