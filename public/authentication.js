$(document).ready(function() {
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
			} else { //signup failed
				console.error("ERROR: Login failed");
			}
		})
		//failed response from login request
		.fail(function(error) {
			$.notify({
				message: "Failed authentication. Is your username/password combination correct?"
			},{
				element: "#login-modal",
				type: "danger"
			});
		});
	}

	/*
		makes a call to the server in attempt to "log out" the user from being "logged in" on the server
		if successful status received, the page will reload and the client will no longer have user credentials
	*/
	$("#logout-button").click(function() {
		$.post("/users/logout")
		.done(function(data) {
			//if logout was successful
			location.href="/"; //reload page
		})
		.fail(function(error) {
			$.notify({
				message: "Failed logout. Try reloading the page?"
			},{
				element: "#login-modal",
				type: "danger"
			});
		});
	});

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
		var email = $("#signup-email").val();
		$.post("/users", {
			"username": username,
			"password": password,
			"email": email,
		})
		//when done, log user in because successful signup doesn't automatically log user in
		.done(function(data) {
			performLoginRequest(username, password);
		})
		//failed response from registration request
		.fail(function(error) {
			console.error("ERROR: ", error);

			$.notify({
				message: "Failed registration. Username taken or email invalid."
			},{
				element: "#login-modal",
				type: "danger"
			});
		});
	});
});