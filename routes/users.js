var express = require('express');
var router = express.Router();
var utils = require('../utils/utils');

var User = require('../models/schema').User;
var Request = require('../models/schema').Request;
var Review = require('../models/ReviewSchema');

var msgbase = require("../messagebase");

/*
	For both login and create user, we want to send an error code if the user
	is logged in, or if the client did not provide a username and password
	This function returns true if an error code was sent; the caller should return
	immediately in this case.
*/
var isLoggedInOrInvalidBody = function(req, res) {
	if (req.currentUser) {
		utils.sendErrResponse(res, 403, 'There is already a user logged in.');
		return true;
	} else if (!(req.body.username && req.body.password)) {
		utils.sendErrResponse(res, 400, 'Username or password not provided.');
		return true;
	}
	return false;
};

/*
	checks to see if the user is logged in
	if so, return user name
*/
router.get("/session", function (req, res) {
	if (req.currentUser) {
		console.log("logged in: " + req.currentUser.username); //debug
		utils.sendSuccessResponse(res, req.currentUser.username);
	} else {
		console.log("not logged in"); //debug
		utils.sendErrResponse(res, 403, 'There is no user currently logged in.');
	}
});

/*
	Determine whether there is a current user logged in

	GET /users/current
	No request parameters
	Response:
		- success.loggedIn: true if there is a user logged in; false otherwise
		- success.user: if success.loggedIn, the currently logged in user
*/
router.get('/current', function(req, res) {
	if (req.currentUser) {
		utils.sendSuccessResponse(res, { loggedIn : true, user : req.currentUser.username });
	} else {
		utils.sendSuccessResponse(res, { loggedIn : false });
	}
});

//TODO ELIMINATE EITHER /SESSION OR /CURRENT BECAUSE THEY'RE THE SAME

/*
	get messages for logged in user
*/
router.get("/messages", function (req, res) {
	if (req.currentUser) {
		console.log("/users/messages route reached"); //debug
		utils.sendSuccessResponse(res, msgbase.getMessagesByUsername(req.currentUser.username));
	} else {
		utils.sendErrResponse(res, 403, 'There is no user currently logged in.');
	}
});


/*
	This function will check to see that the provided username-password combination 
	is valid. For empty username or password, or if the combination is not correct, 
	an error will be returned.

	An user already logged in is not allowed to call the login API again; an attempt
	to do so will result in an error code 403.

	POST /users/login
	Request body:
		- username
		- password
	Response:
		- success: true if login succeeded; false otherwise
		- content: on success, an object with a single field 'user', the object of the logged in user
		- err: on error, an error message
*/
router.post('/login', function(req, res) {
  if (isLoggedInOrInvalidBody(req, res)) {
    return;
  }

  console.log("REQBODY2: ", req.body);

  User.verifyPassword(req.body.username, req.body.password, function(err, match) {

    if (match) {
      req.session.username = req.body.username;
      msgbase.login(req.body.username);
      console.log("LOGIN: logged In users: ", msgbase.getActiveUsers()); //debug
      utils.sendSuccessResponse(res, { user : req.body.username });
    } else {
      utils.sendErrResponse(res, 403, 'Username or password invalid.');
    }
  });
});


/*
	POST /users/logout
	Request body: empty
	Response:
		- success: true if logout succeeded; false otherwise
		- err: on error, an error message
*/
router.post('/logout', function(req, res) {
	if (req.currentUser) {
		msgbase.logout(req.currentUser.username)
		req.session.destroy();
		console.log("LOGOUT: logged In users: ", msgbase.getActiveUsers()); //debug 
		utils.sendSuccessResponse(res);
	} else {
		utils.sendErrResponse(res, 403, 'There is no user currently logged in.');
	}
});

//get online users list
router.get("/", function (req, res) {
	if (req.currentUser) {
		utils.sendSuccessResponse(res, msgbase.getActiveUsers());
	} else {
		utils.sendErrResponse(res, 403, 'There is no user currently logged in.');
	}
});

//get offline users list
router.get("/offline", function (req, res) {
	if (req.currentUser) {
		msgbase.getOfflineUsers(function (err, result) {
			if (err) {
				utils.sendErrResponse(res, 500, 'An unknown error has occurred.');
			}
			console.log("returning the following: ", result); //debug
			utils.sendSuccessResponse(res, result);
		});
	} else {
		utils.sendErrResponse(res, 403, 'There is no user currently logged in.');
	}
});

/*
	Create a new user in the system.

	All usernames in the system must be distinct. If a request arrives with a username that
	already exists, the response will be an error.

	This route may only be called accessed without an existing user logged in. If an existing user
	is already logged in, it will result in an error code 403.

	Does NOT automatically log in the user.

	POST /users
	Request body:
		- username
		- password
	Response:
		- success: true if user creation succeeded; false otherwise
		- err: on error, an error message
*/
router.post('/', function(req, res) {

	if (isLoggedInOrInvalidBody(req, res)) {
		return;
	}

	User.createNewUser(req.body.username, req.body.password, req.body.email,
		function(err, taken) {

			if (!err) {
				if (taken) {
					utils.sendErrResponse(res, 400, 'That username is already taken!');
				} else {
					utils.sendSuccessResponse(res, req.body.username);
				}
			} else {
				utils.sendErrResponse(res, 500, 'An unknown error has occurred.');
			}
	});
});

/*
	Add a new review to given user.
	One review exists per writer per request. If a user has written a review for a request,
	error code 403 is returned.

	POST /users/:userID/reviews
	Request body:
		- victimUsername
		- reviewText
		- rating
		- requestId
	Response:
		- success: true if review creation succeeded; false otherwise
		- err: on error, an error message
*/
router.post('/:userID/reviews', function (req, res) {
	if (req.currentUser) {
		if (req.body.victimUsername != req.params.userID) {
			utils.sendErrResponse(res, 400, 'Malformed review creation request.');
		} else {
			Review.validReview(req.body.requestId, req.currentUser.username, function (err, reviewValid) {
				if (err) {
					utils.sendErrResponse(res, 500, 'An unknown error has occurred.');
				} else {
					if (reviewValid) {
						utils.sendErrResponse(res, 403, 'You may not submit a review.');
					} else {
						Review.addReview(
							req.currentUser.username, 
							req.body.victimUsername, 
							req.body.reviewText, 
							req.body.rating, 
							req.body.requestId, 
							function (err, response) {
								if (err) {
									utils.sendErrResponse(res, 500, 'An unknown error has occurred.');
								} else {
									utils.sendSuccessResponse(res);
								}
							}
						);
					}
				}
			});
		}
	} else {
		utils.sendErrResponse(res, 403, 'Must be logged in to use this feature.');
	}
});

/*
	GET /users/:userID
	Gets a specific user's user page
	Response:
		- success: true if the server succeeded in getting the user and the user's reviews
		- user: on success, an object representing this user
		- reviews: on success, an object representing this user's reviews
		- err: on failure, an error message
*/
router.get('/:userID', function (req, res) {
	if (req.currentUser) {
		User.getUserData(req.params.userID, function (err, userObj) {
			if (err) {
				utils.sendErrResponse(res, 500, 'An unknown error occurred.');
			} else {
				Review.getReviewsByVictimId(userObj.username, function (err, reviewObj) {
					if (err) {
						utils.sendErrResponse(res, 500, 'An unknown error occurred.');	
					} else {
						res.render('profile', {
							userProfile: req.currentUser,
							user: userObj,
							reviews: reviewObj
						});
					}
				});
			}
		});
	} else {
		utils.sendErrResponse(res, 403, 'Must be logged in to use this feature.');
	}
});

module.exports = router;
