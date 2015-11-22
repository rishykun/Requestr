var express = require('express');
var router = express.Router();
var User = require('../models/schema');

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
		//attempt to find and load user data from the User model store
		User.findByUsername(req.currentUser.username, function(err, data) {
			var profile = {};
			profile.username = data.username;
			profile.messages = data.messages;
			profile.following = data.following;
			//exclude sensitive password information
			if (err) {
				console.error("couldn't find user, defaulting to undefined userProfile");

				res.render('index', {
					userProfile: undefined
				});
			} else {

				//get all messages
				Message.getAllMessages(function(err, msgList) {
					//if no messages, render with no message data
					if (err) {
						res.render('index', {
							userProfile: profile,
							allMessages: []
						});
					} else {
					//if messages exist, render with said message data
						res.render('index', {
							userProfile: profile,
							allMessages: msgList
						});
					}
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