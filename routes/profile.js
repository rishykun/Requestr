var express = require('express');
var router = express.Router();
var Schema = require('../models/schema');

/*
	GET user profile

	GET /profile/:profile
	No request parameters
	Response:
		- appropriately rendered user profile only if the user is logged in
*/
router.get('/:profile', function(req, res) {
	console.log("REACHED ROUTE"); //debug
	//check if logged in and render with the appropriate value
	if (req.currentUser) {

		/*
		Schema.Review.getReviewsById(req.params.profile, function(err, reviews) {
		    if (err) {
		      utils.sendErrResponse(res, 500, 'An unknown error occurred.');
		    } else {

		    	res.render('profile', {
		    		loggedInUser: req.currentUser,
					userProfile: req.currentUser, //TODO change this to the user profile data
					reviews: reviews,
				});
		    }
		});*/


		res.render('profile', {
    		loggedInUser: req.currentUser,
			userProfile: req.currentUser, //TODO change this to the user profile data
			//reviews: reviews,
		});

	}
	//if not logged in, render with no userProfile data
	else {
		res.redirect("/");
	}
});

module.exports = router;
