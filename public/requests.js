/*
	handles client-sided app-logic for requests (creating, taking, filtering, etc.)
*/
var handleRequest; //define handleRequest so that it can be used by the frontend
var getAllRequests;

$(document).ready(function() {

	getAllRequests = function() {
		$.get("/requests", {
		})
		//when done, log user in because successful signup doesn't automatically log user in
		.done(function(data) {
			
		})
		//failed response from registration request
		.fail(function(error) {
			console.error("ERROR: ", error);
		});

	}


	$('[data-toggle="tooltip"]').tooltip(); //initializes all bootstrap tooltips

	/*
		instantiates login function in the login form's login button
	*/
	$("#login-form").submit(function(event) {
		event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

		//prepare data to be sent over to backend authentication server
		//automatic data sanitization
		var username = $("#login-username").val();
		var password = $("#login-password").val();

		performLoginRequest(username, password);
	});

	/*
		instantiates signup function in the signup form's signup button
	*/
	$("#signup-form").submit(function(event) {
		event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

		//prepare data to be sent over to backend authentication server
		//automatic data sanitization
		var username = $("#signup-username").val();
		var password = $("#signup-password").val();

		$.post("/users", {
			"username": username,
			"password": password
		})
		//when done, log user in because successful signup doesn't automatically log user in
		.done(function(data) {
			performLoginRequest(username, password);
		})
		//failed response from registration request
		.fail(function(error) {
			console.error("ERROR: ", error);
		});
	});

	/*
		makes a call to the server and attempts to authenticate with the specified credentials
		if successfully authenticated, the page will reload with the correct userprofile and data
		and the user will be "logged in"
		parameters:
			username - the username to check against
			password - the password to check against
	*/
	var performLoginRequest = function(username, password) {
		//make post request to login route
		$.post("/users/login", {
			"username": username,
			"password": password
		})
		//successful response from login request
		.done(function(data) {
			//if signin was successful
			if (data.success) {
				location.href="/"; //reload page

				$("#login-modal").modal("hide");
			} else { //signup failed
				console.error("ERROR: Login failed");
			}
		})
		//failed response from login request
		.fail(function(error) {
			console.error("ERROR: ", error);
		});
	}


	$("#request-expires").datepicker();

	handleRequest = function(request_id, eventType) {
		console.log("handle request called. id: " + request_id + ", eventType: " + eventType); //debug

		//prepare data to be sent over to backend

		//make post request to request route

		/*
			instantiates create request function in the request form's submit button

			submits the request form by making a call to the server in attempt to create the message on the server-side
			if successful, go to home page and the request data now appears in the client-side as well
		*/
		if (eventType === "create") {
			event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

			//prepare data to be sent over to backend
			//reason why we don't simply just pass in the form values to the ajax request is because
			//we handle data sanitization here
			var title = $("#request-title").val();
			var desc = $("#request-desc").val();
			var expires = $("#request-expires").val();

			//make post request to request route
			$.post("/requests/create", {
				"title": title,
				"desc": desc,
				"expires": expires,
			})
			//successful response from request creation
			.done(function(data) {
				//if message creation was successful
				if (data.success) {
					location.href="/"; //go to home page
				} else { //request creation failed
					console.error("ERROR: request creation failed");
				}
			})
			//failed response from request creation
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
		}
		if (eventType === "accept") {
			//accept request
			$.post("/requests/addCandidate", {
				"request_id": request_id
			})
			//successful response from request creation
			.done(function(data) {
				//if call was successful
				if (data.success) {
					//location.href="/"; //go to home page
				} else { //call failed
					console.error("ERROR: request creation failed");
				}
			})
			//failed response from call
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
		}
	}

	handleCandidate = function(username, eventType) {
		console.log("handle user called. id: " + username + ", eventType: " + eventType); //debug

		//prepare data to be sent over to backend

		//make post request to request route

		/*
			instantiates create request function in the request form's submit button

			submits the request form by making a call to the server in attempt to create the message on the server-side
			if successful, go to home page and the request data now appears in the client-side as well
		*/
		if (eventType === "accept") {
			event.preventDefault(); //prevent modal from performing default actions such as closing automatically when submitting form

			//prepare data to be sent over to backend
			//reason why we don't simply just pass in the form values to the ajax request is because
			//we handle data sanitization here
			var title = $("#request-title").val();
			var desc = $("#request-desc").val();
			var expires = $("#request-expires").val();

			//make post request to request route
			$.post("/requests/create", {
				"title": title,
				"desc": desc,
				"expires": expires,
			})
			//successful response from request creation
			.done(function(data) {
				//if message creation was successful
				if (data.success) {
					location.href="/"; //go to home page
				} else { //request creation failed
					console.error("ERROR: request creation failed");
				}
			})
			//failed response from request creation
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
		}
		if (eventType === "reject") {
			/*
			//accept request
			$.post("/requests/addCandidate", {
				"request_id": request_id
			})
			//successful response from request creation
			.done(function(data) {
				//if call was successful
				if (data.success) {
					location.href="/"; //go to home page
				} else { //call failed
					console.error("ERROR: request creation failed");
				}
			})
			//failed response from call
			.fail(function(error) {
				console.error("ERROR: ", error);
			});
			*/
		}
	}
});