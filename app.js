var express = require("express");
var path = require("path");
//var favicon = require("serve_favicon");
var session = require('express-session');
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

// Import route handlers
var index = require('./routes/index');
var users = require('./routes/users');
var requests = require('./routes/requests');
var profile = require('./routes/profile');

//import backend database handler
var mongoose = require("mongoose");

//connect to backend database
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/requestr'); // connect to our database

// Import User model
var Schema = require('./models/schema')
var User = Schema.User;
var Request = Schema.Request;

var msgbase = require("./messagebase");

//setup app
var main = (function Main() {
	var that = Object.create(Main.prototype); 
	that.app = express();

	var io = null;

	that.setPort = function(port) {
		that.app.set('port', port);
	}

	that.getApp = function() {
		return that.app;
	}

	that.setIO = function(IO) {
		io = IO;
		msgbase.setIO(io);
	}

	//use EJS templating engine
	that.app.set('views', path.join(__dirname, 'views'));
	that.app.set('view engine', 'ejs');

	that.app.use(logger('dev'));
	that.app.use(bodyParser.json());
	that.app.use(bodyParser.urlencoded({ extended: true }));
	that.app.use(cookieParser());
	that.app.use(session({ secret : '6170', resave : true, saveUninitialized : true }));
	that.app.use(express.static(path.join(__dirname, 'public'))); //treat public as root folder when linking

	// Authentication middleware. This function
	// is called on _every_ request and populates
	// the req.currentUser field with the logged-in
	// user object based off the username provided
	// in the session variable (accessed by the
	// encrypted cookied).
	that.app.use(function(req, res, next) {
		if (req.session.username) {
			User.getUserData(req.session.username, function(err, user) {
				if (user) {
					req.currentUser = user;
				} else {
					req.session.destroy();
				}
				next();
			});
		} else {
			next();
		}
	});

	// Map paths to imported route handlers
	that.app.use('/', index);
	that.app.use('/users', users);
	that.app.use('/requests', requests);
	that.app.use('/profile', profile);


	// ERROR HANDLERS
	// Note: The methods below are called
	// only if none of the above routes 
	// match the requested pathname.

	// Catch 404 and forward to error handler.
	that.app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	// Development error handler.
	// Will print stacktraces.
	if (that.app.get('env') === 'development') {
		that.app.use(function(err, req, res, next) {
			console.error("ERROR: ", err);
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: err
			});
		});
	}
	// Production error handler.
	// No stacktraces leaked to user.
	that.app.use(function(err, req, res, next) {
		res.status(err.status || 500).end();
	});

	Object.freeze(that); //prevent any further modifications to the member fields and methods of this class
	return that;

})();

module.exports = main;