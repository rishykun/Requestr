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

//import backend database handler
var mongoose = require("mongoose");

//connect to backend database
//mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost:27017/requestr'); // connect to our database

// Import User model
var Schema = require('./models/schema')
var User = Schema.User;
var Request = Schema.Request;

//setup app
var app = express();

//use EJS templating engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret : '6170', resave : true, saveUninitialized : true }));
app.use(express.static(path.join(__dirname, 'public'))); //treat public as root folder when linking

// Authentication middleware. This function
// is called on _every_ request and populates
// the req.currentUser field with the logged-in
// user object based off the username provided
// in the session variable (accessed by the
// encrypted cookied).
app.use(function(req, res, next) {
	if (req.session.username) {
		User.findByUsername(req.session.username, function(err, user) {
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
app.use('/', index);
app.use('/', subscriptions);
app.use('/users', users);
app.use('/requests', requests);


// ERROR HANDLERS
// Note: The methods below are called
// only if none of the above routes 
// match the requested pathname.

// Catch 404 and forward to error handler.
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// Development error handler.
// Will print stacktraces.
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
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
app.use(function(err, req, res, next) {
	res.status(err.status || 500).end();
});

module.exports = app;