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
	console.log("REROUTED----"); //debug
	if (req.currentUser) {
		console.log(1)
		Schema.Request.getAllRequests(function(err, requests) {
		    if (err) {
		      utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		    } else {
		    	console.log(2)
		    	requests.forEach(function(request) {
		    		request.candidates = request.candidates.map(function (ele) {
		    			return ele.username;
			    	});

			    	request.helpers = request.helpers.map(function (ele) {
			    		return ele.username;
			    	});
		    	});
		    	//console.log("req.currentUser: ", req.currentUser);
		    	console.log("requests: ", requests); 
		    	res.render('index', {
					userProfile: req.currentUser,
					requests: requests,
					colors: {"Open": "mediumseagreen", "In progress": "lightcoral", "Completed": "lightskyblue"} //color code
				});
		    }
		 });

		

	}
	//if not logged in, render with no userProfile data
	else {
		console.log("why")
		res.render('index', {
			userProfile: undefined
		});
	}
});

router.post('/', function(req, res) {
	//check if logged in and render with the appropriate value
	console.log("REROUTED----"); //debug
	if (req.currentUser) {
		//console.log("PASSSSSED IN: ", req.body.passedData); //debug

		res.render('index', {
			userProfile: req.currentUser,
			requests: req.body.passedData,
			colors: {"Open": "mediumseagreen", "In progress": "lightcoral", "Completed": "lightskyblue"} //color code
		}, function (err, html) {
			res.send(html);
		});

		/*
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
*/

		

	}
	//if not logged in, render with no userProfile data
	else {
		console.log("NO DAATA");
		res.render('index', {
			userProfile: undefined
		});
	}
});

module.exports = router;